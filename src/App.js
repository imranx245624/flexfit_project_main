import logo from './logo.svg';
import './App.css';



function App() {
  return (
    <div className="div1" >
      <h1>choose your workout</h1>
      <div className='div1a'> 
        <h3>Home workout</h3>
        <p>train in the confort  of your home with <br/> minimal equipment</p> 
        <button className="button1" >start </button>
      </div>
      <div className='div1b'> 
        <h3>Gym workout</h3>
        <p>Access a wide range of equipment and .<br/>maximize your training</p> 
        <button className="button2" >start</button>
      </div>

    </div>
  );
}

export default App;
