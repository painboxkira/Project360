const uploadAudio = async (audio: File) => {
    const formData = new FormData()
    formData.append('files', audio)
    
    const apiUrl = `${import.meta.env.VITE_ACTIVUPLOAD_API_URL}`;
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData
        })
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json()
        
        if (!data || !Array.isArray(data) || data.length === 0) {
            throw new Error('Invalid response format from server');
        }
        
        const fileUrl = data[0].file_url as string;
        if (!fileUrl) {
            throw new Error('No file URL in response');
        }
        
        return fileUrl;
    } catch (error) {
        throw error;
    }
}

export default uploadAudio



