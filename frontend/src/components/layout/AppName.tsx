import { Link } from "@tanstack/react-router";


const AppName = ({className = "", className2=""}) => {
  return (
    <div>
      <Link to="/" className={`text-primary hover:text-primary/90 text-2xl font-bold ${className}`}>
        Suggest.<span className={`text-orange-500 hover:text-primary/90 ${className2}`}>me</span>
      </Link>
    </div>
  );
};

export default AppName;
