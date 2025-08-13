import React, { useState } from 'react';
import './HighCapacityPanel.css';

const HighCapacityPanel = ({ activities, embedded = false }) => {
  // State for load threshold filter
  const [loadThreshold, setLoadThreshold] = useState(0); // 0 = show all
  // Helper function to format date and time
  const formatDateTime = (startTime, endTime) => {
    if (!startTime || !endTime) return '';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    // Get Dutch day abbreviation
    const dayNames = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
    const dayAbbr = dayNames[start.getDay()];
    
    // Format times as HH:MM
    const startTimeStr = start.toLocaleTimeString('nl-NL', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    const endTimeStr = end.toLocaleTimeString('nl-NL', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    
    return `${dayAbbr} ${startTimeStr}-${endTimeStr}`;
  };

  // Get all activities with valid capacity data and calculate their percentages
  const activitiesWithCapacity = activities
    .filter(activity => {
      const capacity = activity.capacity || activity.metadata?.max_participants;
      return capacity && capacity > 0;
    })
    .map(activity => {
      const capacity = activity.capacity || activity.metadata?.max_participants;
      const currentSubscriptions = activity.current_subscriptions || activity.current_participants || 0;
      const percentage = Math.round((currentSubscriptions / capacity) * 100);
      const dateTimeStr = formatDateTime(activity.start_time, activity.end_time);
      return { ...activity, percentage, capacity, currentSubscriptions, dateTimeStr };
    })
    .filter(activity => activity.percentage > loadThreshold) // Apply load threshold filter
    .sort((a, b) => {
      // Sort by start time (earliest first)
      const timeA = new Date(a.start_time);
      const timeB = new Date(b.start_time);
      return timeA - timeB;
    });

  // Count total activities for display
  const totalActivitiesWithCapacity = activities.filter(activity => {
    const capacity = activity.capacity || activity.metadata?.max_participants;
    return capacity && capacity > 0;
  }).length;

  const getEmptyMessage = () => {
    if (totalActivitiesWithCapacity === 0) {
      return "Geen activiteiten met capaciteitsgegevens gevonden.";
    }
    if (loadThreshold > 0) {
      return `Geen activiteiten boven ${loadThreshold}% bezetting gevonden.`;
    }
    return "Geen activiteiten gevonden.";
  };

  const getCountText = () => {
    if (loadThreshold > 0) {
      return `${activitiesWithCapacity.length} van ${totalActivitiesWithCapacity} activiteiten boven ${loadThreshold}% bezetting`;
    }
    return "\u00A0";
  };

  if (activitiesWithCapacity.length === 0) {
    const containerClass = embedded 
      ? "flex flex-col" 
      : "bg-white rounded-lg shadow-md p-4";
    const titleClass = embedded ? "hidden" : "text-lg font-medium mb-3";
    
    return (
      <div className={containerClass} style={embedded ? {} : { maxHeight: '640px' }}>
        <h3 className={titleClass}>Activities</h3>
        
        {/* Load Filter Radio Buttons */}
        <div className="mb-3 flex flex-wrap gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="loadFilter"
              value={0}
              checked={loadThreshold === 0}
              onChange={(e) => setLoadThreshold(parseInt(e.target.value))}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Alle activiteiten</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="loadFilter"
              value={25}
              checked={loadThreshold === 25}
              onChange={(e) => setLoadThreshold(parseInt(e.target.value))}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">&gt; 25% bezetting</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="loadFilter"
              value={50}
              checked={loadThreshold === 50}
              onChange={(e) => setLoadThreshold(parseInt(e.target.value))}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">&gt; 50% bezetting</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="loadFilter"
              value={75}
              checked={loadThreshold === 75}
              onChange={(e) => setLoadThreshold(parseInt(e.target.value))}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">&gt; 75% bezetting</span>
          </label>
        </div>
        
        <p className="text-sm text-gray-500 mb-3 text-right">
          {getCountText()}
        </p>
        <p className="text-gray-500 text-center py-4 text-sm">{getEmptyMessage()}</p>
      </div>
    );
  }

  const containerClass = embedded 
    ? "flex flex-col" 
    : "bg-white rounded-lg shadow-md p-4 flex flex-col";
  const titleClass = embedded ? "hidden" : "text-lg font-medium mb-2";
  
  return (
    <div className={containerClass} style={embedded ? {} : { maxHeight: '640px' }}>
      <h3 className={titleClass}>Activities</h3>
      
      {/* Load Filter Radio Buttons */}
      <div className="mb-3 flex flex-wrap gap-4">
        <label className="flex items-center">
          <input
            type="radio"
            name="loadFilter"
            value={0}
            checked={loadThreshold === 0}
            onChange={(e) => setLoadThreshold(parseInt(e.target.value))}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Alle activiteiten</span>
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name="loadFilter"
            value={25}
            checked={loadThreshold === 25}
            onChange={(e) => setLoadThreshold(parseInt(e.target.value))}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">&gt; 25% bezetting</span>
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name="loadFilter"
            value={50}
            checked={loadThreshold === 50}
            onChange={(e) => setLoadThreshold(parseInt(e.target.value))}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">&gt; 50% bezetting</span>
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name="loadFilter"
            value={75}
            checked={loadThreshold === 75}
            onChange={(e) => setLoadThreshold(parseInt(e.target.value))}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">&gt; 75% bezetting</span>
        </label>
      </div>
      
      <p className="text-sm text-gray-500 mb-3 text-right">
        {getCountText()}
      </p>
      <div className="space-y-2 overflow-y-auto flex-1">
        {activitiesWithCapacity.map(activity => {
          const { percentage, capacity, currentSubscriptions, dateTimeStr } = activity;
          
          // Determine color based on percentage
          let colorClass = 'bg-gray-400'; // 0-50%
          if (percentage >= 95) colorClass = 'bg-red-600';
          else if (percentage >= 85) colorClass = 'bg-orange-500';
          else if (percentage >= 75) colorClass = 'bg-yellow-500';
          else if (percentage >= 50) colorClass = 'bg-blue-500';
          
          return (
            <div key={activity.id} className="border border-gray-200 rounded p-3 hover:shadow-sm transition-shadow">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-900 text-sm truncate pr-2 flex-1">
                  {dateTimeStr && <span className="font-normal" style={{ color: '#aaa' }}>{dateTimeStr} </span>}
                  {activity.name}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-semibold text-gray-600">
                    {currentSubscriptions} / {capacity}
                  </span>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                    percentage >= 95 ? 'bg-red-100 text-red-700' :
                    percentage >= 85 ? 'bg-orange-100 text-orange-700' :
                    percentage >= 75 ? 'bg-yellow-100 text-yellow-700' :
                    percentage >= 50 ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {percentage}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-300 ${colorClass}`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              {activity.location && (
                <p className="text-xs text-gray-500 mt-1.5 truncate">📍 {activity.location}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HighCapacityPanel;