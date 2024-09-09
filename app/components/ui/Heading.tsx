interface InputProps {
    heading: string;
  }
  
  const Heading = (props: InputProps) => {
    return (
      <div className="flex justify-center my-5">
        <h1 className="text-4xl font-bold p-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-md shadow-lg">
          {props.heading}
        </h1>
      </div>
    );
  };
  
  export default Heading;
  