import React from 'react';
import EventManagement from '../components/Management/EventManagement';

const EventsPage: React.FC = () => {
  return (
    <div className="w-full mx-auto px-2 sm:px-4 lg:px-6 py-4 lg:py-8">
      <EventManagement />
    </div>
  );
};

export default EventsPage;
