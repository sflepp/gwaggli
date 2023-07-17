import React  from 'react';
interface StatusIndicatorProps {
    color: 'red' | 'orange' | 'green' | undefined;
}
const StatusIndicator = ({ color }: StatusIndicatorProps) => {
    return (
        <div className="status-indicator" color={color}></div>
    )
}

export default StatusIndicator;