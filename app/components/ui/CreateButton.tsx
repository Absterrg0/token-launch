interface InputProps {
    textButton: string;
    onClick: () => void; // Updated to not expect any event parameter
  }
  
  const CreateButton = (props: InputProps) => {
    return (
      <div className="flex justify-center mt-6">
        <button
          onClick={props.onClick}
          className="rounded-md text-white bg-indigo-600 p-4 font-semibold shadow-lg hover:bg-indigo-700 transition duration-300"
        >
          {props.textButton}
        </button>
      </div>
    );
  };
  
  export default CreateButton;
  