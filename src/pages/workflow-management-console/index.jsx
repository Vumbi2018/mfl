import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '../../components/navigation/Sidebar';
import Sidebar from '../../components/navigation/Sidebar';
import MobileMenuButton from '../../components/navigation/MobileMenuButton';
import WorkflowStatusIndicator from '../../components/navigation/WorkflowStatusIndicator';
import IntegrationHealthMonitor from '../../components/navigation/IntegrationHealthMonitor';
import WorkflowHeader from './components/WorkflowHeader';
import TaskQueueTable from './components/TaskQueueTable';
import SubmissionDetailsPanel from './components/SubmissionDetailsPanel';
import FilterPanel from './components/FilterPanel';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import Icon from '../../components/AppIcon';
import api from '../../utils/api';
import WorkflowConfigModal from './components/WorkflowConfigModal';


const WorkflowManagementConsole = () => {
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    region: 'all',
    province: 'all',
    district: 'all',
    facilityType: 'all',
    status: 'all',
    priority: 'all',
    submissionAge: 'all'
  });

  const userRole = 'District Coordinator';

  const [stats, setStats] = useState({
    pendingApprovals: 0,
    inReview: 0,
    escalated: 0,
    approvedToday: 0
  });

  const mockTasks = [
    {
      id: 'SUB-2024-001',
      facilityName: 'Central District Hospital',
      facilityImage: "https://images.unsplash.com/photo-1656932867014-1f86699fc7c4",
      facilityImageAlt: 'Modern multi-story hospital building with glass facade and emergency entrance visible in urban setting',
      location: 'District 1, Central Region',
      fullAddress: '123 Healthcare Avenue, Central District, Province 1',
      facilityType: 'Hospital',
      submitter: 'Dr. Sarah Johnson',
      submitterAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_10608de73-1763295287117.png",
      submitterAvatarAlt: 'Professional headshot of woman with brown hair in white medical coat smiling at camera',
      submissionDate: '2024-12-10',
      priority: 'high',
      status: 'pending',
      daysRemaining: 2,
      contactPhone: '+1-555-0123',
      contactEmail: 'info@centralhospital.gov',
      coordinates: { lat: 40.7128, lng: -74.0060 },
      comments: [
        {
          author: 'John Smith',
          authorAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_187ac2848-1764684680250.png",
          authorAvatarAlt: 'Professional headshot of man with short dark hair in blue shirt',
          timestamp: '2 hours ago',
          text: 'Please verify the GPS coordinates. They seem to be slightly off from the provided address.'
        }],

      changeHistory: [
        {
          action: 'Submission Created',
          user: 'Dr. Sarah Johnson',
          timestamp: '2024-12-10 09:30 AM',
          icon: 'FileText',
          details: 'Initial facility submission with complete documentation'
        },
        {
          action: 'Assigned for Review',
          user: 'System',
          timestamp: '2024-12-10 09:35 AM',
          icon: 'UserCheck'
        }],

      validationResults: [
        { check: 'GPS Coordinates', status: 'passed', message: 'Coordinates are within valid range and match administrative boundaries' },
        { check: 'Contact Information', status: 'passed', message: 'Phone and email verified successfully' },
        { check: 'Duplicate Detection', status: 'warning', message: 'Similar facility found within 500m radius. Manual verification recommended.' },
        { check: 'Documentation', status: 'passed', message: 'All required documents uploaded and verified' }]

    },
    {
      id: 'SUB-2024-002',
      facilityName: 'Northern Community Clinic',
      facilityImage: "https://images.unsplash.com/photo-1690129069991-293aba732645",
      facilityImageAlt: 'Small single-story clinic building with white walls and blue trim in suburban neighborhood',
      location: 'District 2, Northern Region',
      fullAddress: '456 Community Road, Northern District, Province 2',
      facilityType: 'Clinic',
      submitter: 'Nurse Maria Garcia',
      submitterAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_100ef577e-1763294608562.png",
      submitterAvatarAlt: 'Professional headshot of Hispanic woman with long dark hair in medical scrubs',
      submissionDate: '2024-12-11',
      priority: 'medium',
      status: 'in-review',
      daysRemaining: 4,
      contactPhone: '+1-555-0456',
      contactEmail: 'contact@northernclinic.gov',
      coordinates: { lat: 41.8781, lng: -87.6298 },
      comments: [],
      changeHistory: [
        {
          action: 'Submission Created',
          user: 'Nurse Maria Garcia',
          timestamp: '2024-12-11 02:15 PM',
          icon: 'FileText'
        }],

      validationResults: [
        { check: 'GPS Coordinates', status: 'passed', message: 'Coordinates verified and accurate' },
        { check: 'Contact Information', status: 'passed', message: 'All contact details verified' },
        { check: 'Duplicate Detection', status: 'passed', message: 'No duplicates found' },
        { check: 'Documentation', status: 'passed', message: 'Complete documentation provided' }]

    },
    {
      id: 'SUB-2024-003',
      facilityName: 'Eastern Province Pharmacy',
      facilityImage: "https://images.unsplash.com/photo-1655235322241-f76e40e9a1a4",
      facilityImageAlt: 'Modern pharmacy storefront with large glass windows displaying medical supplies and green cross sign',
      location: 'District 3, Eastern Region',
      fullAddress: '789 Medical Plaza, Eastern District, Province 1',
      facilityType: 'Pharmacy',
      submitter: 'Pharmacist David Lee',
      submitterAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_10f8cd7a5-1763295837867.png",
      submitterAvatarAlt: 'Professional headshot of Asian man with glasses in white pharmacy coat',
      submissionDate: '2024-12-09',
      priority: 'critical',
      status: 'escalated',
      daysRemaining: 1,
      contactPhone: '+1-555-0789',
      contactEmail: 'info@easternpharmacy.gov',
      coordinates: { lat: 34.0522, lng: -118.2437 },
      comments: [
        {
          author: 'Admin Team',
          authorAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_151378054-1763295516123.png",
          authorAvatarAlt: 'Professional headshot of woman with blonde hair in business attire',
          timestamp: '1 day ago',
          text: 'This submission has been escalated due to approaching deadline. Immediate review required.'
        }],

      changeHistory: [
        {
          action: 'Submission Created',
          user: 'Pharmacist David Lee',
          timestamp: '2024-12-09 11:00 AM',
          icon: 'FileText'
        },
        {
          action: 'Escalated',
          user: 'System',
          timestamp: '2024-12-13 09:00 AM',
          icon: 'TrendingUp',
          details: 'Auto-escalated due to approaching SLA deadline'
        }],

      validationResults: [
        { check: 'GPS Coordinates', status: 'passed', message: 'Location verified successfully' },
        { check: 'Contact Information', status: 'passed', message: 'Contact details confirmed' },
        { check: 'Duplicate Detection', status: 'passed', message: 'No duplicates detected' },
        { check: 'Documentation', status: 'warning', message: 'Operating license expires in 30 days. Renewal required.' }]

    },
    {
      id: 'SUB-2024-004',
      facilityName: 'Southern Health Center',
      facilityImage: "https://img.rocket.new/generatedImages/rocket_gen_img_1dff3e706-1765311501840.png",
      facilityImageAlt: 'Two-story health center building with red brick exterior and covered entrance in residential area',
      location: 'District 1, Southern Region',
      fullAddress: '321 Wellness Street, Southern District, Province 3',
      facilityType: 'Health Center',
      submitter: 'Dr. Michael Chen',
      submitterAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_126a6b0dc-1763300720152.png",
      submitterAvatarAlt: 'Professional headshot of Asian man with short black hair in medical coat with stethoscope',
      submissionDate: '2024-12-12',
      priority: 'medium',
      status: 'pending',
      daysRemaining: 5,
      contactPhone: '+1-555-0321',
      contactEmail: 'contact@southernhealth.gov',
      coordinates: { lat: 29.7604, lng: -95.3698 },
      comments: [],
      changeHistory: [
        {
          action: 'Submission Created',
          user: 'Dr. Michael Chen',
          timestamp: '2024-12-12 10:45 AM',
          icon: 'FileText'
        }],

      validationResults: [
        { check: 'GPS Coordinates', status: 'passed', message: 'Coordinates validated successfully' },
        { check: 'Contact Information', status: 'passed', message: 'All information verified' },
        { check: 'Duplicate Detection', status: 'passed', message: 'No duplicates found' },
        { check: 'Documentation', status: 'passed', message: 'Complete and valid documentation' }]

    },
    {
      id: 'SUB-2024-005',
      facilityName: 'Western Medical Laboratory',
      facilityImage: "https://images.unsplash.com/photo-1653020448362-2874d98735df",
      facilityImageAlt: 'Modern laboratory building with steel and glass construction featuring large windows and scientific equipment visible inside',
      location: 'District 2, Western Region',
      fullAddress: '654 Science Boulevard, Western District, Province 2',
      facilityType: 'Laboratory',
      submitter: 'Lab Director Emma Wilson',
      submitterAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1096a3cbd-1763296376031.png",
      submitterAvatarAlt: 'Professional headshot of woman with red hair in white lab coat holding clipboard',
      submissionDate: '2024-12-13',
      priority: 'low',
      status: 'pending',
      daysRemaining: 6,
      contactPhone: '+1-555-0654',
      contactEmail: 'info@westernlab.gov',
      coordinates: { lat: 37.7749, lng: -122.4194 },
      comments: [],
      changeHistory: [
        {
          action: 'Submission Created',
          user: 'Lab Director Emma Wilson',
          timestamp: '2024-12-13 03:20 PM',
          icon: 'FileText'
        }],

      validationResults: [
        { check: 'GPS Coordinates', status: 'passed', message: 'Location coordinates verified' },
        { check: 'Contact Information', status: 'passed', message: 'Contact information validated' },
        { check: 'Duplicate Detection', status: 'passed', message: 'No duplicate facilities detected' },
        { check: 'Documentation', status: 'passed', message: 'All required documents present' }]

    }];


  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [facilityTypeOptions, setFacilityTypeOptions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch 'Pending' facilities
        const [tasksRes, locRes, typesRes, statsRes] = await Promise.all([
          api.get('/facilities?status=Pending&limit=50'),
          api.get('/facilities/locations'),
          api.get('/facilities/types'),
          api.get('/analytics/summary')
        ]);

        setStats({
          pendingApprovals: statsRes.data.pendingApprovals || 0,
          inReview: statsRes.data.inReview || 0,
          escalated: statsRes.data.escalated || 0,
          approvedToday: statsRes.data.approvedToday || 0
        });

        // Process Tasks
        const pendingFacilities = tasksRes.data.data.map(f => ({
          id: f.id,
          facilityName: f.name || f.common_name,
          facilityImage: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=300&h=200", // Placeholder
          facilityImageAlt: 'Facility Image',
          location: f.district || 'Unknown District',
          fullAddress: [f.street_address, f.city, f.province].filter(Boolean).join(', '),
          facilityType: f.type,
          submitter: 'Field Officer', // Placeholder as we don't fetch last_updated_by name yet
          submitterAvatar: "https://ui-avatars.com/api/?name=Field+Officer&background=random",
          submissionDate: f.updated_at || f.created_at || new Date().toISOString(),
          priority: 'medium', // Logic could infer this from changes
          status: 'pending',
          daysRemaining: 7, // Placeholder logic
          contactPhone: f.general_contact || 'N/A',
          contactEmail: f.contact_email || 'N/A',
          coordinates: { lat: parseFloat(f.latitude) || 0, lng: parseFloat(f.longitude) || 0 },
          comments: [], // TODO: Fetch comments/audit log
          changeHistory: [
            {
              action: 'Status Update',
              user: 'Field Officer',
              timestamp: f.updated_at ? new Date(f.updated_at).toLocaleString() : 'Unknown',
              icon: 'FileText',
              details: 'Facility marked as Pending'
            }
          ],
          validationResults: [
            { check: 'GPS Coordinates', status: f.latitude && f.longitude ? 'passed' : 'warning', message: f.latitude ? 'Coordinates present' : 'Missing coordinates' }
          ]
        }));
        setTasks(pendingFacilities);
        setFilteredTasks(pendingFacilities);

        // Process Locations
        const processLocations = (regions) => {
          const opts = [];
          regions.forEach(r => {
            opts.push({ value: r.name, label: r.name }); // Region
            r.provinces?.forEach(p => {
              p.districts?.forEach(d => {
                opts.push({ value: d.name, label: d.name }); // District
              });
            });
          });
          return opts;
        };
        setJurisdictionOptions(processLocations(locRes.data));

        // Process Types
        setFacilityTypeOptions(typesRes.data.map(t => ({ value: t, label: t })));

      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e?.target?.tagName === 'INPUT' || e?.target?.tagName === 'TEXTAREA') return;

      switch (e?.key) {
        case 'j':
          handleNextTask();
          break;
        case 'k':
          handlePreviousTask();
          break;
        case 'a':
          if (selectedTask) handleApprove(selectedTask?.id);
          break;
        case 'r':
          if (selectedTask) handleReject(selectedTask?.id);
          break;
        case '?':
          setShowShortcuts(true);
          break;
        case 'Escape':
          setShowShortcuts(false);
          setSelectedTask(null);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedTask, filteredTasks]);

  const handleNextTask = () => {
    if (!selectedTask && filteredTasks?.length > 0) {
      setSelectedTask(filteredTasks?.[0]);
      return;
    }

    const currentIndex = filteredTasks?.findIndex((t) => t?.id === selectedTask?.id);
    if (currentIndex < filteredTasks?.length - 1) {
      setSelectedTask(filteredTasks?.[currentIndex + 1]);
    }
  };

  const handlePreviousTask = () => {
    if (!selectedTask) return;

    const currentIndex = filteredTasks?.findIndex((t) => t?.id === selectedTask?.id);
    if (currentIndex > 0) {
      setSelectedTask(filteredTasks?.[currentIndex - 1]);
    }
  };

  const handleApprove = (taskId) => {
    console.log('Approving task:', taskId);
    alert(`Task ${taskId} approved successfully!`);
  };

  const handleReject = async (taskId) => {
    try {
      // Maybe change status to 'Rejected' or revert?
      // For now, let's keep it simple and just log/alert. 
      // Or update a status to 'Changes Requested'

      await api.put(`/facilities/${taskId}`, { operational_status: 'Closed' }); // Example rejection logic

      const updatedTasks = tasks.filter(t => t.id !== taskId);
      setTasks(updatedTasks);
      setFilteredTasks(updatedTasks);
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
      alert(`Facility ${taskId} rejected/closed.`);
    } catch (err) {
      console.error("Error rejecting task:", err);
      alert("Failed to reject task.");
    }
  };

  const handleComment = (taskId, comment) => {
    console.log('Adding comment to task:', taskId, comment);
    const updatedTasks = tasks?.map((task) => {
      if (task?.id === taskId) {
        return {
          ...task,
          comments: [
            ...task?.comments,
            {
              author: 'You',
              authorAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_16633a99c-1763292514213.png",
              authorAvatarAlt: 'Professional headshot of current user in business attire',
              timestamp: 'Just now',
              text: comment
            }]

        };
      }
      return task;
    });
    setTasks(updatedTasks);
  };

  const handleBulkAction = (action, taskIds) => {
    console.log(`Bulk ${action}:`, taskIds);
    alert(`${action} action applied to ${taskIds?.length} submissions`);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };

      // Cascade clear
      if (key === 'region') {
        newFilters.province = 'all';
        newFilters.district = 'all';
      } else if (key === 'province') {
        newFilters.district = 'all';
      }

      return newFilters;
    });
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      region: 'all',
      province: 'all',
      district: 'all',
      facilityType: 'all',
      status: 'all',
      priority: 'all',
      submissionAge: 'all'
    });
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <MobileMenuButton />

        <main className="main-content flex-1 p-6">
          <div className="max-w-[1920px] mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <WorkflowStatusIndicator />
              <div className="flex items-center gap-4">
                <IntegrationHealthMonitor />
                <button
                  onClick={() => setShowShortcuts(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  title="Keyboard Shortcuts">

                  <Icon name="Keyboard" size={16} />
                  <span className="hidden lg:inline">Shortcuts</span>
                </button>
              </div>
            </div>

            <WorkflowHeader
              stats={stats}
              userRole={userRole}
              onConfigureWorkflow={() => setShowConfigModal(true)}
            />

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-3">
                <FilterPanel
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                  locations={locations}
                  facilityTypeOptions={facilityTypeOptions}
                />

              </div>

              <div className="col-span-5">
                <TaskQueueTable
                  tasks={filteredTasks}
                  selectedTask={selectedTask}
                  onSelectTask={setSelectedTask}
                  onBulkAction={handleBulkAction} />

              </div>

              <div className="col-span-4">
                <SubmissionDetailsPanel
                  task={selectedTask}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onEdit={(taskId) => navigate(`/facilities/${taskId}`)}
                  onComment={handleComment} />

              </div>
            </div>
          </div>
        </main>

        <KeyboardShortcutsModal
          isOpen={showShortcuts}
          onClose={() => setShowShortcuts(false)} />

        <WorkflowConfigModal
          isOpen={showConfigModal}
          onClose={() => setShowConfigModal(false)} />

      </div>
    </SidebarProvider>);

};

export default WorkflowManagementConsole;