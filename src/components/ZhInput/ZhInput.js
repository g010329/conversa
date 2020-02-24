import React, {useEffect, useState} from "react";
import {
  isChrome,
  isFirefox,
  isSafari,
  isIE,
  isEdge,
  isOpera
} from "../../lib/BrowserDetection";
const ZhInput = props => {
  const [inputValue, setInputValue] = useState("");
  const [isOnComposition, setIsOnComposition] = useState(false);
  const [isInnerChangeFromOnChange, setIsInnerChangeFromOnChange] = useState(false);

  useEffect(() => {
    setInputValue(props.curValue);
  }, []);

  // Force input value updating after option has been deleted
  useEffect(() => {
    if (props.forceUpdate) {
      setInputValue(props.curValue);
    }
  });

  const handleChange = e => {
    // Flow check
    if (!(e.target instanceof HTMLInputElement)) return;

    if (isInnerChangeFromOnChange) {
      setInputValue(e.target.value);
      props.useInnerValue(e.target.value, props);
      setIsInnerChangeFromOnChange(false);
      return;
    }

    // when is on composition, change inputValue only
    // when not in composition change inputValue and innerValue both
    if (!isOnComposition) {
      setInputValue(e.target.value);
      props.useInnerValue(e.target.value, props);
    } else {
      setInputValue(e.target.value);
    }
  };

  const handleComposition = e => {
    // Flow check
    if (!(e.target instanceof HTMLInputElement)) return;

    if (e.type === "compositionend") {
      // Chrome is ok for only setState innerValue
      // Opera, IE and Edge is like Chrome
      if (isChrome || isIE || isEdge || isOpera) {
        props.useInnerValue(e.target.value, props);
      }

      // Firefox need to setState inputValue again...
      if (isFirefox) {
        setInputValue(e.target.value);
        props.useInnerValue(e.target.value, props);
      }

      // Safari think e.target.value in composition event is keyboard char,
      //  but it will fired another change after compositionend
      if (isSafari) {
        // do change in the next change event
        setIsInnerChangeFromOnChange(true);
      }
      setIsOnComposition(false);
    } else {
      setIsOnComposition(false);
    }
  };
  return (
    <input
      type="text"
      className="input"
      value={inputValue}
      onChange={e => handleChange(e)}
      onCompositionUpdate={e => handleComposition(e)}
      onCompositionEnd={e => handleComposition(e)}
      onCompositionStart={e => handleComposition(e)}
    />
  );
};

export default ZhInput;
