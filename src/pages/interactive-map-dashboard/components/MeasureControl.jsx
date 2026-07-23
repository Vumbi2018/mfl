import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-measure/dist/leaflet-measure.css';
import 'leaflet-measure';

const MeasureControl = () => {
    const map = useMap();

    useEffect(() => {
        const measureControl = new L.Control.Measure({
            position: 'topleft',
            primaryLengthUnit: 'meters',
            secondaryLengthUnit: 'kilometers',
            primaryAreaUnit: 'sqmeters',
            secondaryAreaUnit: 'hectares',
            activeColor: '#db4c4c',
            completedColor: '#20633f'
        });

        map.addControl(measureControl);

        return () => {
            map.removeControl(measureControl);
        };
    }, [map]);

    return null;
};

export default MeasureControl;
