import L from 'leaflet';

/**
 * Creates custom SVG divIcons for Provincial Headquarters (Large Civic Building Pin)
 */
export const getProvincialHQIcon = (name) => {
  return L.divIcon({
    className: 'custom-provincial-hq-icon',
    html: `
      <div style="position: relative; width: 44px; height: 56px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; cursor: pointer; filter: drop-shadow(0 4px 10px rgba(134, 25, 143, 0.45)); z-index: 1000;">
        <div style="
          width: 44px;
          height: 44px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          background: linear-gradient(135deg, #d946ef 0%, #c026d3 50%, #86198f 100%);
          border: 3px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 2px 4px rgba(255,255,255,0.4);
        ">
          <div style="transform: rotate(45deg); color: #ffffff; font-size: 16px; font-weight: 900; display: flex; align-items: center; justify-content: center;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px;">
              <path d="M12 3L2 12h3v8h14v-8h3L12 3zm1 14h-2v-4h2v4zm0-6h-2V9h2v2z"/>
            </svg>
          </div>
        </div>
        <div style="
          position: absolute;
          bottom: -2px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(134, 25, 143, 0.4);
          filter: blur(2px);
        "></div>
      </div>
    `,
    iconSize: [44, 56],
    iconAnchor: [22, 56],
    popupAnchor: [0, -54],
    tooltipAnchor: [22, -28]
  });
};

/**
 * Creates custom SVG divIcons for District Headquarters (Civic Building Pin)
 */
export const getDistrictHQIcon = (name) => {
  return L.divIcon({
    className: 'custom-district-hq-icon',
    html: `
      <div style="position: relative; width: 28px; height: 38px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; cursor: pointer; filter: drop-shadow(0 3px 8px rgba(13, 148, 136, 0.4)); z-index: 900;">
        <div style="
          width: 28px;
          height: 28px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          background: linear-gradient(135deg, #14b8a6 0%, #0d9488 50%, #0f766e 100%);
          border: 2px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 2px 4px rgba(255,255,255,0.3);
        ">
          <div style="transform: rotate(45deg); color: #ffffff; font-size: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 13px; height: 13px;">
              <path d="M12 3L2 12h3v8h14v-8h3L12 3zm1 14h-2v-4h2v4zm0-6h-2V9h2v2z"/>
            </svg>
          </div>
        </div>
        <div style="
          position: absolute;
          bottom: -2px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(13, 148, 136, 0.4);
          filter: blur(1.5px);
        "></div>
      </div>
    `,
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -36],
    tooltipAnchor: [14, -19]
  });
};
