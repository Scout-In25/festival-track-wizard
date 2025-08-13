import React, { useState } from 'react';
import Modal from './Modal.jsx';

// Icon components (copied from ActivitiesListPage for reuse)
const CalendarPlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM12 13h-2v-2h2V9h2v2h2v2h-2v2h-2v-2z"/>
  </svg>
);

const CalendarCheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zm-7-2l-4-4 1.41-1.41L12 14.17l6.59-6.58L20 9l-8 8z"/>
  </svg>
);

// Cross/Remove icon component
const CrossIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Time slot action icons
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const BlockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" strokeWidth={2} />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12" />
  </svg>
);

// Chevron icon for collapsible sections
const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 15l-6-6-6 6" />
  </svg>
);

const ActivityDetailsModal = ({ 
  isOpen, 
  onClose, 
  activity, 
  activityDetails, 
  isLoading, 
  isUserLoggedIn,
  isUserSubscribed,
  isSubscribing,
  conflictingActivities,
  getActivityStatus,
  handleSubscribeToggle,
  formatTime,
  onSwitchToActivity,
  isTransitioning,
  onUnsubscribeFromConflict,
  availableTimeSlots,
  onTimeSlotSubscribe
}) => {
  const [isTimeSlotsExpanded, setIsTimeSlotsExpanded] = useState(false);
  
  if (!activity) return null;

  const details = activityDetails?.[activity.id];
  const isSubscribed = isUserSubscribed(activity.id);
  const subscribing = isSubscribing[activity.id];
  const conflicts = conflictingActivities || [];
  const timeSlots = availableTimeSlots || [];

  // Helper function to format date and time for time slots
  const formatDateTimeSlot = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    const dateOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long'
    };
    
    const timeOptions = { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    };
    
    const dateStr = start.toLocaleDateString('nl-NL', dateOptions);
    const startTimeStr = start.toLocaleTimeString('nl-NL', timeOptions);
    const endTimeStr = end.toLocaleTimeString('nl-NL', timeOptions);
    
    return {
      date: dateStr,
      time: `${startTimeStr} - ${endTimeStr}`
    };
  };

  const renderModalContent = () => {
    if (isLoading) {
      return (
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <p style={{ 
            fontSize: '0.85rem', 
            fontWeight: 'bold', 
            color: '#4a5568',
            margin: '8px 0'
          }}>Details laden...</p>
        </div>
      );
    }

    if (!details) {
      return (
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <p style={{ color: '#6b7280', margin: 0 }}>Geen details beschikbaar</p>
        </div>
      );
    }

    if (details.error) {
      return (
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <p style={{ color: '#dc3545', fontStyle: 'italic', margin: 0 }}>{details.error}</p>
        </div>
      );
    }

    return (
      <div className={`modal-content-wrapper ${isTransitioning ? 'transitioning' : ''}`} style={{ padding: '0' }}>
        {/* Activity Date, Time and Duration */}
        <div style={{ 
          padding: '0 24px 16px'
        }}>
          <div style={{ 
            fontSize: '0.85rem',
            color: '#64748b',
            fontWeight: '400'
          }}>
            {new Date(activity.start_time).toLocaleDateString('nl-NL', { weekday: 'long' }).charAt(0).toUpperCase() + new Date(activity.start_time).toLocaleDateString('nl-NL', { weekday: 'long' }).slice(1)} {formatTime(activity.start_time)} - {formatTime(activity.end_time)} • Duur: {(() => {
              const start = new Date(activity.start_time);
              const end = new Date(activity.end_time);
              const durationMs = end - start;
              const hours = Math.floor(durationMs / (1000 * 60 * 60));
              const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
              
              if (hours > 0 && minutes > 0) {
                return `${hours} uur ${minutes} minuten`;
              } else if (hours > 0) {
                return `${hours} uur`;
              } else {
                return `${minutes} minuten`;
              }
            })()}
          </div>
        </div>

        {/* Activity Description */}
        {details.description && (
          <div style={{ padding: '12px 24px 20px', borderTop: '1px solid #e5e7eb' }}>
            <p style={{ color: '#000', margin: '0', lineHeight: '1.6', fontSize: '0.95rem' }}>
              {details.description}
            </p>
          </div>
        )}
        
        {/* Activity Image */}
        {details.image_url && (
          <div style={{ padding: '0 24px 20px' }}>
            <img 
              src={details.image_url} 
              alt={details.name || activity.name}
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
          </div>
        )}

        {/* Available Time Slots */}
        {timeSlots.length > 0 && (
          <div style={{ 
            margin: '0',
            borderTop: '1px solid #e5e7eb',
            padding: '20px 24px'
          }}>
            <button
              onClick={() => setIsTimeSlotsExpanded(!isTimeSlotsExpanded)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0',
                margin: '0',
                width: '100%',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#2d3748',
                transition: 'color 0.2s ease',
                boxShadow: 'none'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#4a5568';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#2d3748';
              }}
              aria-expanded={isTimeSlotsExpanded}
              aria-label={`${isTimeSlotsExpanded ? 'Inklapppen' : 'Uitklappen'} tijdsloten sectie`}
            >
              <h3 style={{ 
                margin: '0', 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#2d3748',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textTransform: 'none'
              }}>
                📅 Tijdsloten ({timeSlots.length})
              </h3>
              <span style={{ 
                transition: 'transform 0.2s ease',
                transform: isTimeSlotsExpanded ? 'rotate(0deg)' : 'rotate(-90deg)'
              }}>
                {isTimeSlotsExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
              </span>
            </button>
            
            {isTimeSlotsExpanded && (
              <>
                <p style={{ 
                  margin: '16px 0 16px 0', 
                  fontSize: '0.85rem', 
                  color: '#64748b',
                  lineHeight: '1.4'
                }}>
                  Deze activiteit heeft meerdere tijdsloten.
                </p>
                
                <div style={{
                  fontSize: '13px'
                }}>
                  {timeSlots.map(slot => {
                    const dateTime = formatDateTimeSlot(slot.start_time, slot.end_time);
                    const slotSubscribing = isSubscribing[slot.id];
                    
                    return (
                      <div 
                        key={slot.id}
                        className="time-slot-item"
                        style={{ 
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px',
                          margin: '6px 0',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                          backgroundColor: slot.isCurrentActivity ? '#f3f4ff' : (slot.isSubscribed ? '#f0f9ff' : '#fff'),
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontWeight: '600', 
                            color: slot.isCurrentActivity ? '#7c3aed' : (slot.isSubscribed ? '#0369a1' : '#374151'),
                            marginBottom: '2px'
                          }}>
                            {slot.isCurrentActivity && '📍 '}{dateTime.date}{slot.isCurrentActivity && ' (huidig)'}
                          </div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: slot.isCurrentActivity ? '#a855f7' : (slot.isSubscribed ? '#0284c7' : '#6b7280')
                          }}>
                            {dateTime.time}
                          </div>
                          {slot.hasConflict && (
                            <div style={{ 
                              fontSize: '11px', 
                              color: '#dc2626',
                              marginTop: '2px'
                            }}>
                              ⚠️ Tijdconflict
                            </div>
                          )}
                        </div>
                        
                        
                        {/* Check if slot is unavailable (full or has conflicts) and user is not subscribed */}
                        {((slot.status === 'full' || slot.status === 'conflict' || slot.hasConflict) && !slot.isSubscribed) ? (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 10px',
                              backgroundColor: '#f3f4f6',
                              color: '#6b7280',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          >
                            <BlockIcon />
                            {slot.status === 'full' ? 'Vol' : slot.status === 'conflict' || slot.hasConflict ? 'Conflict' : 'Niet beschikbaar'}
                          </div>
                        ) : isUserLoggedIn ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTimeSlotSubscribe && onTimeSlotSubscribe(slot.id);
                            }}
                            disabled={slotSubscribing}
                            className="time-slot-action-btn"
                            aria-label={slot.isSubscribed ? `Afmelden van tijdslot ${dateTime.date} ${dateTime.time}` : `Aanmelden voor tijdslot ${dateTime.date} ${dateTime.time}`}
                            title={slot.isSubscribed ? 'Afmelden van dit tijdslot' : 'Aanmelden voor dit tijdslot'}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: slotSubscribing ? 'not-allowed' : 'pointer',
                              padding: '6px',
                              borderRadius: '4px',
                              color: slot.isSubscribed ? '#dc2626' : '#16a34a',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease',
                              opacity: slotSubscribing ? 0.5 : 1
                            }}
                            onMouseEnter={(e) => {
                              if (!slotSubscribing) {
                                e.target.style.backgroundColor = slot.isSubscribed ? '#fef2f2' : '#f0fdf4';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!slotSubscribing) {
                                e.target.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            {slotSubscribing ? (
                              <div style={{ 
                                width: '14px', 
                                height: '14px', 
                                border: '2px solid transparent',
                                borderTop: '2px solid currentColor',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                              }} />
                            ) : slot.isSubscribed ? (
                              <CrossIcon />
                            ) : (
                              <PlusIcon />
                            )}
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Schedule Section for Logged-in Users */}
        {isUserLoggedIn && (
          <div style={{ 
            margin: '0',
            borderTop: '1px solid #e5e7eb',
            padding: '20px 24px'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <h3 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: conflicts.length > 0 ? '#92400e' : '#2d3748',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {isSubscribed ? '✓ In je schema' : 
                 getActivityStatus(activity) === 'full' ? '❌ Activiteit vol' : 
                 conflicts.length > 0 ? '⚠️ Tijdconflict' :
                 '📋 Voeg toe aan je schema'}
              </h3>
              <p style={{ 
                margin: '0', 
                fontSize: '0.85rem', 
                color: '#000',
                lineHeight: '1.4'
              }}>
                {isSubscribed 
                  ? 'Deze activiteit staat in je persoonlijke schema' 
                  : getActivityStatus(activity) === 'full' 
                    ? 'Deze activiteit heeft geen vrije plekken meer'
                    : conflicts.length > 0
                      ? 'Je bent al aangemeld voor een overlappende activiteit:'
                      : 'Voeg deze activiteit toe aan je persoonlijke schema'
                }
              </p>
            </div>
            
            {/* Action Button or Status Display */}
            {getActivityStatus(activity) === 'full' && !isSubscribed ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                backgroundColor: '#e5e7eb',
                color: '#6b7280',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                width: '100%',
                justifyContent: 'center'
              }}>
                <span>🚫</span>
                Activiteit is vol
              </div>
            ) : conflicts.length > 0 && !isSubscribed ? (
              <div 
                role="alert"
                aria-label={`Tijdconflict met ${conflicts.length} activiteit${conflicts.length > 1 ? 'en' : ''}`}
                style={{ 
                  color: '#92400e',
                  fontSize: '13px'
                }}
              >
                {conflicts.map(conflict => (
                  <div 
                    key={conflict.id}
                    className="conflict-item"
                    style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      position: 'relative'
                    }}
                  >
                    <div 
                      style={{ flex: 1, cursor: 'pointer' }}
                      onClick={() => onSwitchToActivity && onSwitchToActivity(conflict.id)}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && onSwitchToActivity) {
                          e.preventDefault();
                          onSwitchToActivity(conflict.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Bekijk details van ${conflict.name}`}
                      title={`Klik om details van ${conflict.name} te bekijken`}
                    >
                      <div style={{ fontWeight: '600' }}>{conflict.name}</div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#a16207',
                        marginTop: '2px'
                      }}>
                        {formatTime(conflict.start_time)} - {formatTime(conflict.end_time)}
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnsubscribeFromConflict && onUnsubscribeFromConflict(conflict.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          onUnsubscribeFromConflict && onUnsubscribeFromConflict(conflict.id);
                        }
                      }}
                      className="conflict-unsubscribe-btn"
                      aria-label={`Afmelden van ${conflict.name}`}
                      title={`Afmelden van ${conflict.name}`}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        color: '#dc3545',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        marginLeft: '8px',
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#f8d7da';
                        e.target.style.color = '#721c24';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#dc3545';
                      }}
                    >
                      <CrossIcon />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <button 
                onClick={() => handleSubscribeToggle(activity.id)}
                disabled={subscribing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  backgroundColor: isSubscribed ? '#f59e0b' : '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: subscribing ? 'not-allowed' : 'pointer',
                  opacity: subscribing ? 0.6 : 1,
                  fontSize: '15px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  width: '100%',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  if (!subscribing) {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!subscribing) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }
                }}
              >
                {subscribing ? (
                  <>
                    <div style={{ 
                      width: '16px', 
                      height: '16px', 
                      border: '2px solid transparent',
                      borderTop: '2px solid currentColor',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Even geduld...
                  </>
                ) : isSubscribed ? (
                  <>
                    <CalendarCheckIcon />
                    Schrijf je uit
                  </>
                ) : (
                  <>
                    <CalendarPlusIcon />
                    Schrijf je in
                  </>
                )}
              </button>
            )}
            
            {/* Capacity Progress Bar */}
            {(activity.capacity || activity.metadata?.max_participants) && (
              <div style={{ margin: '24px 0 0 0' }}>
                {(() => {
                  const current = activity.current_subscriptions || activity.current_participants || 0;
                  const total = activity.capacity || activity.metadata?.max_participants;
                  const percentage = Math.min((current / total) * 100, 100);
                  
                  // Determine color based on fullness
                  let progressColor = '#10b981'; // green
                  if (percentage >= 90) {
                    progressColor = '#ef4444'; // red
                  } else if (percentage >= 70) {
                    progressColor = '#f59e0b'; // orange/yellow
                  }
                  
                  return (
                    <>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '4px'
                      }}>
                        <span style={{ 
                          fontSize: '12px', 
                          color: '#374151',
                          fontWeight: '500'
                        }}>
                          Bezetting
                        </span>
                        <span style={{ 
                          fontSize: '12px', 
                          color: '#6b7280'
                        }}>
                          {current} / {total}
                        </span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${percentage}%`,
                          height: '100%',
                          backgroundColor: progressColor,
                          borderRadius: '4px',
                          transition: 'width 0.3s ease, background-color 0.3s ease'
                        }} />
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={activity.name || activity.title || 'Activiteit Details'}
      ariaLabelledBy="activity-modal-title"
      ariaDescribedBy="activity-modal-content"
      maxWidth="650px"
      maxHeight="85vh"
    >
      <div id="activity-modal-content">
        {renderModalContent()}
      </div>
    </Modal>
  );
};

export default ActivityDetailsModal;