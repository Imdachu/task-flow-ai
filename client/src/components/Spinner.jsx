import './Spinner.css';

function Spinner({ size = 40 }) {
  return (
    <div className="spinner" style={{ width: size, height: size }} aria-label="Loading">
      <div className="spinner-inner" />
    </div>
  );
}

export default Spinner;
