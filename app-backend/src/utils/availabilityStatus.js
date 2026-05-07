export const determineAvailabilityStatus = ({
    checkedIn,
    activeShift
  }) => {
    if (!checkedIn) {
      return 'OFF_DUTY';
    }
  
    if (activeShift) {
      return 'BUSY';
    }
  
    return 'AVAILABLE';
  };