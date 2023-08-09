import { useEffect, useRef } from 'react';
import ACTIONS from '../utils/SocketActions';
import Codemirror from 'codemirror';
// Editor
import 'codemirror/lib/codemirror.css';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';

// Themes
import 'codemirror/theme/dracula.css';
import 'codemirror/theme/midnight.css';
import 'codemirror/theme/eclipse.css';

// Syntax Highlightings
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python';


export default function Editor({ codeLang, setCodeLang, theme, socketRef, roomId, onCodeChange }) {

  const editorRef = useRef(null);

  useEffect(() => {
    async function init() {

      var element = document.getElementById('realTimeEditor');

      editorRef.current = Codemirror.fromTextArea(element, {
        mode: {name: 'javascript', json: true},
        theme: theme,
        autoCloseTags: true,
        autoCloseBrackets: true,
        lineNumbers: true
      });

      editorRef.current.on('change', (instance, changes) => {
        const { origin } = changes;
        const code = instance.getValue();         // Get content from editor
        onCodeChange(code);                       // Update Code in parent component

        if(origin !== 'setValue') {
          socketRef.current.emit(ACTIONS.CODE_CHANGE, {
            roomId,
            code,
          });
        }
      });

    }

    init();
  }, [])

  useEffect(() => {

    if (socketRef.current) {
        // Listen for changes pushed from server

        // For Code Changes
        socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
          if (code !== null) {
            editorRef.current.setValue(code);
          }
        });

        // For code Language changes
        socketRef.current.on(ACTIONS.LANG_CHANGE, ({ codeLang }) => {
          setCodeLang(codeLang);
        })
    }

    return () => {
        socketRef.current.off(ACTIONS.CODE_CHANGE);
    };
}, [socketRef.current]);


  // Updates syntax highlightings based on the current Language
  useEffect(()=> {

    if(codeLang === 'python3') {
      editorRef.current.setOption('mode', {name: 'python', json: true});
      editorRef.current.setValue("# Code your thoughts here ... \n");
    }
    else {
      editorRef.current.setOption('mode', {name: 'javascript', json: true});
      editorRef.current.setValue("// Code your thoughts here ... \n");
    }
  },[codeLang])

  // Change theme
  useEffect(()=> {
    editorRef.current.setOption('theme', theme);
  }, [theme])
  

  return (
    <textarea id="realTimeEditor"></textarea>
  )
}
