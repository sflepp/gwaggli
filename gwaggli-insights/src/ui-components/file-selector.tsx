import {useState} from "react";


interface FileSelectorPros {
    onFileSelected: (file: File) => void
}

const FileSelector = ({onFileSelected}: FileSelectorPros) => {

    const [file, setFile] = useState<File | null>(null)

    const handleFileChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0])
        }
    }

    const handleSubmit = () => {
        if (file) {
            onFileSelected(file)
        }
    }

    return (
        <div>
            <input type={"file"} onChange={handleFileChanged}/>
            <div>{file && `${file.name} - ${file.type}`}</div>

            <button onClick={handleSubmit}>Submit</button>
        </div>
    )
}

export default FileSelector