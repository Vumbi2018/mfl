const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

dotenv.config();


const app = express();
const PORT = (() => {
  const p = process.env.PORT || 5002;
  console.log(`🔧  Backend will listen on port ${p}`);
  return p;
})();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-code']
}));
app.use(express.json());

// Static files
const multer = require('multer');


// Configure storage for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'public/uploads');
    if (!require('fs').existsSync(uploadDir)) {
      require('fs').mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|svg|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpg, png, svg, webp) are allowed!'));
  }
});

// Dedicated Spatial File Upload Middleware (.zip, .geojson, .shp)
const spatialStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'public/uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'spatial-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const spatialUpload = multer({
  storage: spatialStorage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit for shapefiles
});

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));



// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.method === 'POST') {
    console.log('Body:', JSON.stringify(req.body));
  }
  next();
});

// Database Connection
const pool = require('./db');

pool.connect()
  .then(() => console.log('Connected to PostgreSQL database'))
  .catch(err => console.error('Database connection error:', err.stack));

// Routes
const authController = require('./controllers/auth.controller');
const facilityController = require('./controllers/facility.controller');
const userController = require('./controllers/user.controller');
const analyticsController = require('./controllers/analytics.controller');
const ticketController = require('./controllers/ticket.controller');

// Routes
// Auth
app.get('/api/auth/tenants', authController.getTenants);
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);

// Middleware
const verifyToken = require('./middleware/auth.middleware');
const tenantMiddleware = require('./middleware/tenant.middleware');

// Apply middleware globally to /api
app.use('/api', verifyToken);
app.use('/api', tenantMiddleware);

// Facilities
app.get('/api/facilities', facilityController.getFacilities);
app.post('/api/facilities', facilityController.createFacility);
app.get('/api/facilities/types', facilityController.getFacilityTypes); 
app.get('/api/facilities/locations', facilityController.getLocations); 
app.get('/api/facilities/public', facilityController.getAllFacilitiesPublic); 
app.get('/api/facilities/public/no-region', facilityController.getAllFacilitiesNoRegion);
app.get('/api/facilities/locations/no-region', facilityController.getLocationsNoRegion);

// FHIR Interoperability Routes
app.get('/api/fhir/Location', facilityController.getFacilitiesFHIR);
app.get('/api/fhir/Location/:id', facilityController.getFacilityFHIR);
app.get('/api/facilities/:id', facilityController.getFacilityById);
app.put('/api/facilities/:id', facilityController.updateFacility);
app.get('/api/tickets', ticketController.getTickets);
app.post('/api/tickets', ticketController.createTicket);

// Users
app.get('/api/users', userController.getUsers);
app.post('/api/users', userController.createUser);
app.put('/api/users/:id', userController.updateUser);
app.delete('/api/users/:id', userController.deleteUser);

// Analytics
app.get('/api/analytics/summary', analyticsController.getSummary);
app.get('/api/analytics/coverage', analyticsController.getCoverage);
app.get('/api/analytics/activity', analyticsController.getActivity);
app.get('/api/analytics/distribution', analyticsController.getDistribution);

// Audit Logs
const auditController = require('./controllers/audit.controller');
app.get('/api/audit/logs', auditController.getAuditLogs);

// WHO MFL Reference Data (Public endpoints)
const referenceController = require('./controllers/reference.controller');
app.get('/api/reference/facility-types', referenceController.getFacilityTypes);
app.get('/api/reference/service-types', referenceController.getServiceTypes);
app.get('/api/reference/service-categories', referenceController.getServiceCategories);
app.get('/api/reference/verification-methods', referenceController.getVerificationMethods);
app.get('/api/reference/workflow-states', referenceController.getWorkflowStates);

// DHIS2 Integration Export
app.get('/api/export/dhis2/orgunits', referenceController.exportDHIS2OrgUnits);

// Facility Services (WHO service taxonomy)
app.get('/api/facilities/:id/services', verifyToken, referenceController.getFacilityServices);
app.put('/api/facilities/:id/services', verifyToken, referenceController.updateFacilityServices);

// Facility Verification
app.post('/api/facilities/:id/verify', verifyToken, referenceController.verifyFacility);
app.get('/api/facilities/:id/verifications', verifyToken, referenceController.getFacilityVerifications);

// External Identifiers (Cross-reference with other systems)
app.get('/api/facilities/:id/identifiers', verifyToken, referenceController.getFacilityIdentifiers);
app.post('/api/facilities/:id/identifiers', verifyToken, referenceController.addFacilityIdentifier);


// Admin (Generic Table Editor)
const adminController = require('./controllers/admin.controller');
const settingsController = require('./controllers/settings.controller');

app.get('/api/settings', verifyToken, settingsController.getSettings);
app.put('/api/settings', verifyToken, settingsController.updateSettings);
app.post('/api/settings/upload-logo', verifyToken, upload.single('logo'), settingsController.uploadLogo);

app.get('/api/admin/tables', verifyToken, adminController.getTables);
app.post('/api/admin/tables/:tableName/upload', verifyToken, upload.single('csvFile'), adminController.uploadCSV);
app.get('/api/admin/tables/:tableName', verifyToken, adminController.getTableData);
app.post('/api/admin/tables/:tableName', verifyToken, adminController.createTableRow);
app.put('/api/admin/tables/:tableName/:id', verifyToken, adminController.updateTableRow);
app.delete('/api/admin/tables/:tableName/:id', verifyToken, adminController.deleteTableRow);

// Role Permissions Management
app.get('/api/roles/permissions', verifyToken, adminController.getAllRolePermissions);
app.get('/api/roles/:roleId/permissions', verifyToken, adminController.getRolePermissions);
app.post('/api/roles/:roleId/permissions', verifyToken, adminController.setRolePermissions);

// Groups Management (With Counts)
app.get('/api/groups', verifyToken, adminController.getGroupsWithCounts);

// Spatial Data Routes (4-Level Administrative Hierarchy & Shapefile Uploads)
const spatialController = require('./controllers/spatial.controller');
app.get('/api/spatial/hierarchy', verifyToken, spatialController.getHierarchy);
app.get('/api/spatial/level1', verifyToken, spatialController.getRegions);
app.get('/api/spatial/level2', verifyToken, spatialController.getProvinces);
app.get('/api/spatial/level3', verifyToken, spatialController.getDistricts);
app.get('/api/spatial/level4', verifyToken, spatialController.getWards);
app.get('/api/spatial/provinces', verifyToken, spatialController.getProvinces);
app.get('/api/spatial/districts', verifyToken, spatialController.getDistricts);
app.post('/api/spatial/inspect-shapefile', verifyToken, spatialUpload.single('shapefile'), spatialController.inspectShapefile);
app.post('/api/spatial/upload-shapefile', verifyToken, spatialUpload.single('shapefile'), spatialController.uploadShapefile);
app.put('/api/spatial/boundaries/:level/:id', verifyToken, spatialController.updateBoundary);
app.delete('/api/spatial/boundaries/:level/:id', verifyToken, spatialController.deleteBoundary);
app.delete('/api/spatial/level/:level', verifyToken, spatialController.deleteLevelBoundaries);
app.get('/api/spatial/health-offices', spatialController.getHealthOffices);





// Data Dictionary (RMR F4, RMR F5)
app.get('/api/reference/data-dictionary', referenceController.getDataDictionary);
app.post('/api/reference/data-dictionary', verifyToken, referenceController.createDataDictionaryElement);

// Facility Saved Sub-Lists (RMR F13)
const sublistController = require('./controllers/sublist.controller');
app.get('/api/sublists', verifyToken, sublistController.getSublists);
app.get('/api/sublists/:id', verifyToken, sublistController.getSublistById);
app.post('/api/sublists', verifyToken, sublistController.createSublist);
app.delete('/api/sublists/:id', verifyToken, sublistController.deleteSublist);

// In-App Notifications (RMR F23)
const notificationController = require('./controllers/notification.controller');
app.get('/api/notifications', verifyToken, notificationController.getNotifications);
app.put('/api/notifications/read-all', verifyToken, notificationController.markAllRead);
app.put('/api/notifications/:id/read', verifyToken, notificationController.markAsRead);

// Version Management & Releases (RMR F22)
const versionController = require('./controllers/version.controller');
app.get('/api/versions/releases', verifyToken, versionController.getReleases);
app.post('/api/versions/releases', verifyToken, versionController.createRelease);
app.get('/api/versions/diff', verifyToken, versionController.compareReleases);

// Interoperability Hub & Standard API Connectors (RMR NF16 & OpenHIE)
const interopController = require('./controllers/interop.controller');
app.get('/api/interop/fhir/Location', interopController.getFHIRLocations);
app.get('/api/interop/dhis2/orgunits', interopController.getDHIS2OrgUnits);
app.get('/api/interop/openlmis/facilities', interopController.getOpenLMISFacilities);
app.get('/api/interop/geojson/facilities', interopController.getGeoJSONFacilities);
app.get('/api/interop/metrics', verifyToken, interopController.getInteropMetrics);

// Configurable HIS Connections & Sync Engine (PUSH / PULL / BIDIRECTIONAL)
const connectionController = require('./controllers/connection.controller');
app.get('/api/connections', verifyToken, connectionController.getConnections);
app.post('/api/connections', verifyToken, connectionController.createConnection);
app.put('/api/connections/:id', verifyToken, connectionController.updateConnection);
app.delete('/api/connections/:id', verifyToken, connectionController.deleteConnection);
app.post('/api/connections/:id/sync', verifyToken, connectionController.executeSync);
app.get('/api/connections/:id/logs', verifyToken, connectionController.getSyncLogs);




// Health Check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      version: '1.0.0',
      timestamp: new Date()
    });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected', error: err.message, timestamp: new Date() });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Force restart timestamp: 2026-02-06 14:00
module.exports = { app, pool };


