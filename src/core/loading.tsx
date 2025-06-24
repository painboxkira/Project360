export const Loading = () => {
    return (    
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(245, 245, 245, 0.95)',
            zIndex: 1000
        }}>
            <div style={{
                width: '300px',
                marginBottom: '20px'
            }}>
                <div style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '3px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#007bff',
                        borderRadius: '3px',
                        animation: 'loading 1.5s ease-in-out infinite'
                    }} />
                </div>
            </div>
            <div style={{
                fontSize: '16px',
                color: '#666',
                fontFamily: 'Arial, sans-serif'
            }}>
                Loading scene data...
            </div>
            <style>
                {`
                    @keyframes loading {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                    }
                `}
            </style>
        </div>
    );
};
