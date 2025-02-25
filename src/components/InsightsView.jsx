import React from 'react';
import ModularInsightsView from './insights/InsightsView';

// This is just a wrapper component that uses the modular implementation
const InsightsView = (props) => {
  console.log("Wrapper InsightsView props:", props);
  return <ModularInsightsView {...props} />;
};

export default InsightsView; 