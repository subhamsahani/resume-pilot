import { prepareInstructions } from '../../constants/index';
import React, { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router';
import FileUploader from '~/components/FileUploader';
import Navbar from '~/components/Navbar'
import { convertPdfToImage } from '~/lib/pdftoimage';
import { usePuterStore } from '~/lib/puter';
import { generateUUID } from '~/lib/uuid';

const upload = () => {
  const {auth, isLoading, fs, ai, kv} = usePuterStore();
  const navigate = useNavigate()

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [file, setFile] = useState<File | null>(null)

  const handleFileSelect: (file: File | null) => void = (file) => {
    setFile(file);
  };

//   const handleAnalyze = async ({companyName, jobTitle, jobDescription, file}: {companyName: string, jobTitle: string, jobDescription: string, file: File}) => {
//     setIsProcessing(true);
//     setStatusText('Uploading the file...')
//     const uploadedFile = await fs.upload([file]);
//     console.log("UPLAODED FILEEEEEE======>>",uploadedFile)
//     if(!uploadedFile) return setStatusText('Error: Failed to upload file')
        
//     console.log("FILEEEEEE after upload====>",file)
//     setStatusText('Converting to image...');
//     // const imageFile = await convertPdfToImage()
//     const imageFile = await convertPdfToImage(file)
//     // const imageFile = await convertPdfToImage(file)
//     console.log("IMAGE FILEEEEE=========>",imageFile)
//     if(!imageFile.file) return setStatusText('Error failed to convert PDF to image')

//     setStatusText('Uploading the image');
//     const upLoadedImage = await fs.upload([imageFile.file]);
//     if(!upLoadedImage) return setStatusText('Error: Failed to upload image');

//     setStatusText('Preapring data...')

//     const uuid = generateUUID();

//     const data = {
//         id: uuid,
//         resumepath: uploadedFile.path,
//         imagepath: upLoadedImage.path,
//         companyName, jobTitle, jobDescription,
//         feedback: ''
//     }

//     await kv.set(`resume:${uuid}`, JSON.stringify(data));
//     setStatusText('Analyzing...');
//     const feedback = await ai.feedback(
//         uploadedFile.path,
//         prepareInstructions({jobTitle, jobDescription})
//     )
//     if(!feedback) return setStatusText('Error: Failed to analyze resume');

//     const feedbacText = typeof feedback.message.content === 'string'
//         ? feedback.message.content
//         : feedback.message.content[0].text;

//     data.feedback = JSON.parse(feedbacText);
//     await kv.set(`resume:${uuid}`, JSON.stringify(data));
//     setStatusText('Analysis complete, redirecting...');
//     console.log("DATAAAAAAAAAAAAAA=======>",data);
//   }

const handleAnalyze = async ({
  companyName,
  jobTitle,
  jobDescription,
  file,
}: {
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  file: File;
}) => {
  try {
    setIsProcessing(true);
    setStatusText("Uploading the file...");

    // Upload the raw resume file (PDF)
    const uploadedFile = await fs.upload([file]);

    if (!uploadedFile) {
      setStatusText("Error: Failed to upload file");
      return;
    }

    setStatusText("Converting to image...");
    // Make sure we pass the *File* directly, not a Worker or path
    const imageFile = await convertPdfToImage(file);

    if (!imageFile || !imageFile.file) {
      setStatusText("Error: Failed to convert PDF to image");
      return;
    }

    setStatusText("Uploading the image...");
    const uploadedImage = await fs.upload([imageFile.file]);
    if (!uploadedImage) {
      setStatusText("Error: Failed to upload image");
      return;
    }

    setStatusText("Preparing data...");

    const uuid = generateUUID();

    const data = {
      id: uuid,
      resumePath: uploadedFile.path,
      imagePath: uploadedImage.path,
      companyName,
      jobTitle,
      jobDescription,
      feedback: "",
    };

    await kv.set(`resume:${uuid}`, JSON.stringify(data));

    setStatusText("Analyzing...");
    const feedback = await ai.feedback(
      uploadedFile.path, // use the PDF file path for AI
      prepareInstructions({ jobTitle, jobDescription })
    );

    if (!feedback) {
      setStatusText("Error: Failed to analyze resume");
      return;
    }

    // Handle feedback message correctly
    const feedbackText =
      typeof feedback.message.content === "string"
        ? feedback.message.content
        : feedback.message.content[0].text;

    data.feedback = JSON.parse(feedbackText);

    await kv.set(`resume:${uuid}`, JSON.stringify(data));
    setStatusText("Analysis complete, redirecting...");

    navigate(`/resume/${uuid}`)
  } catch (err) {
    setStatusText("Unexpected error occurred while analyzing resume");
  }
};


  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget.closest('form');
    if(!form) return;
    const formData = new FormData(form)

    const companyName = formData.get('company-name') as string;
    const jobTitle = formData.get('job-title') as string;
    const jobDescription = formData.get('job-description') as string;


    if(!file) return;

    handleAnalyze({companyName, jobTitle, jobDescription, file})
  }

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
        <Navbar/>

        <section className='main-section'>
            <div className='page-heading py-16'>
                <h1>Feedback that gets you hired</h1>
                {isProcessing ? (
                    <>
                        <h2>{statusText}</h2>
                        <img src="/images/resume-scan.gif" alt="" className='w-full' />
                    </>
                ) : (
                    <h2>Drop your resume for an ATS score and improvement tips</h2>
                )}
                {!isProcessing && (
                    <form id="uplaod-form" onSubmit={handleSubmit} className='flex flex-col gap-4 mt-8'>
                        <div className='form-div'>
                            <label htmlFor="company-name">Company Name</label>
                            <input type="text" name='company-name' placeholder='Company Name' id='company-name' />
                        </div>

                        <div className='form-div'>
                            <label htmlFor="job-title">Job Title</label>
                            <input type="text" name='job-title' placeholder='Job Title' id='job-title' />
                        </div>

                        <div className='form-div'>
                            <label htmlFor="job-description">Job Description</label>
                            <textarea rows={5} name='job-description' placeholder='Job Description' id='job-desccription' />
                        </div>

                        <div className='form-div'>
                            <label htmlFor="uploader">Uplaod Resume</label>
                            <FileUploader onFileSelect={handleFileSelect}/>
                        </div>

                        <button className='primary-button' type="submit">
                            Analyze Resume
                        </button>
                    </form>
                )

                }
            </div>
        </section>
    </main>
  )
}

export default upload