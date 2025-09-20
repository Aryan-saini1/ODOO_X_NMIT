import React from 'react';

function Wo() {
  // For now, this is just a placeholder.
  // You can't directly create WOs, they are created when an MO is created.
  // We could add functionality to list WOs for a given MO.
  return (
    <div>
      <h2>Work Orders (WO)</h2>
      <div className="card">
        <p>Work Orders are created automatically when a Manufacturing Order is created.</p>
        <p>Future functionality could include listing WOs by MO ID, and starting/completing them.</p>
      </div>
    </div>
  );
}

export default Wo;
