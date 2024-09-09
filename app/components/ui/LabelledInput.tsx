interface InputProps {
    label: string;
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }
  
  const LabelledInput = (props: InputProps) => {
    return (
      <div className="p-4 mb-6">
        <label className="block text-xl font-semibold mb-2 text-gray-700">
          {props.label}
        </label>
        <input
          className="text-gray-800 rounded-md p-3 w-full bg-gray-200 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300"
          type="text"
          placeholder={props.placeholder}
          value={props.value}
          onChange={props.onChange}
        />
      </div>
    );
  };
  
  export default LabelledInput;
  