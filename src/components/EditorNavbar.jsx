import React from 'react';
import Select from 'react-select';
import ACTIONS from '../utils/SocketActions';
import "../styles/editorNav.css";
import LiveIcon from '@mui/icons-material/CloudSync';

const customStyles = {
  control: () => ({
    border: '1px solid #949494',
    borderRadius: '5px',
    marginTop: '5px',
    height: '30px',
    width: 'auto',
    display: 'flex',
    alignItems: 'center',
    fontSize: '18px',
  }),
}


const EditorNavbar = (props) => {

  const {
    codeLang, setCodeLang,
    theme, setTheme, socketRef, roomId
  } = props;

  const languages = [
    { value: "c", label: "C" },
    { value: "cpp", label: "C++" },
    { value: "python3", label: "Python" },
    { value: "java", label: "Java" },
    { value: "javascript", label: "Javascript" },
  ];

  const themes = [
    { value: "dracula", label: "Dracula" },
    { value: "eclipse", label: "Eclipse" },
    { value: "midnight", label: "Midnight" },
  ];

  function handleLanguageChange(e) {
    setCodeLang(e.value);

    //emit change to server
    socketRef.current.emit(ACTIONS.LANG_CHANGE, {
      roomId,
      codeLang: e.value,
    })
  }

  return (
    <div className='editorNavWrapper'>

      <div className='editorNavSelect'>
        <span className='titleText'>LANGUAGE</span>
        <Select
          className="editorNavChangeBtn"
          styles={customStyles}
          options={languages}
          value={codeLang}
          onChange={(e) => handleLanguageChange(e)}
          placeholder={codeLang}
        />
      </div>

      <div className='editorNavSelect'>
        <span className='titleText'>THEME</span>
        <Select
          className="editorNavChangeBtn"
            styles={customStyles}
            options={themes}
            value={theme}
            onChange={(e) => setTheme(e.value)}
          placeholder={theme}
        />
      </div>

      <div className="liveBox">
        <LiveIcon />
        <span className='liveText'> L I V E</span>
      </div>

    </div>
  )
}
export default EditorNavbar;