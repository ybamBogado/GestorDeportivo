import './Loader.css';

export default function Loader() {
    return (
        <div className="loader-container">
            <div className="logo-wrapper">
                
                <div className="spinner-border text-primary custom-spinner" role="status"></div>
                
                <img 
                    src="/Ticketinador.png" 
                    alt="Logo" 
                    className="loader-logo" 
                />
            </div>
        </div>
    );
}
