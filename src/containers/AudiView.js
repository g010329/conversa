import React, {Fragment, useEffect} from "react";
import {useFirestore} from "react-redux-firebase";
import {FormattedMessage} from "react-intl";
import logo from "../img/conversa.png";
import "./style.css";
// FontAwesome Setting
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {library} from "@fortawesome/fontawesome-svg-core";
import {faLaughSquint} from "@fortawesome/free-regular-svg-icons";
library.add(faLaughSquint);

import Button from "@material-ui/core/Button";
import Radio from "@material-ui/core/Radio";
import {withStyles} from "@material-ui/core/styles";
import {lightGreen} from "@material-ui/core/colors";
const GreenRadio = withStyles({
  root: {
    "&$checked": {
      color: lightGreen[600]
    }
  },
  checked: {}
})(props => <Radio color="default" {...props} />);

const AudiView = props => {
  console.log(props);
  const db = useFirestore();
  //get uuid
  const _uuid = () => {
    let d = Date.now();
    if (typeof performance !== "undefined" && typeof performance.now === "function") {
      d += performance.now(); //use high-precision timer if available
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      let r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  };

  useEffect(() => {
    if (!localStorage.getItem("audiId")) {
      localStorage.setItem("audiId", _uuid());
    }
    props.getAudiId();
  }, []);

  if (props.involvedAudi !== undefined && props.audiId !== undefined) {
    if (!props.involvedAudi.includes(props.audiId)) {
      props.involvedAudi.push(props.audiId);
      db.collection("invitation")
        .doc(props.projId)
        .update({involvedAudi: props.involvedAudi});
    }
  }
  return (
    <Fragment>
      {props.curSldIndex === undefined ? <span>Loading</span> : <Poll {...props} />}
    </Fragment>
  );
};
export default AudiView;

const Poll = props => {
  const db = useFirestore();

  const respondPoll = e => {
    e.preventDefault();
    let newSlds = props.slds.map((sld, index) => {
      if (index === props.curSldIndex) {
        if (sld.result[props.selOptIndex] === "") {
          sld.result[props.selOptIndex] = 1;
        } else {
          sld.result[props.selOptIndex]++;
        }
      }
      return sld;
    });

    db.collection("users")
      .doc(props.userId)
      .collection("projects")
      .doc(props.projId)
      .update({slds: newSlds});

    props.respondedAudi[props.slds[props.curSldIndex].id].push(props.audiId);

    db.collection("invitation")
      .doc(props.projId)
      .update({respondedAudi: props.respondedAudi});
  };

  const addReaction = type => {
    props.reaction[type]++;
    db.collection("invitation")
      .doc(props.projId)
      .update({reaction: props.reaction});
  };

  return (
    <div className="poll">
      <div className="poll-logo">
        <img src={logo} alt="logo" />
      </div>
      {props.slds[props.curSldIndex].sldType === "multiple-choice" ? (
        props.slds[props.curSldIndex].opts !== "" ? (
          props.respondedAudi[props.slds[props.curSldIndex].id].includes(props.audiId) ? (
            <Wait {...props} />
          ) : (
            <Fragment>
              <div>{props.slds[props.curSldIndex].qContent}</div>
              <form
                name="poll-form"
                id="poll-form"
                onSubmit={e => {
                  respondPoll(e);
                }}>
                {props.slds[props.curSldIndex].opts.map((item, index) => (
                  <label className="res-group" key={index}>
                    <GreenRadio
                      type="radio"
                      name="res-group"
                      value={index}
                      checked={props.selOptIndex == index}
                      onChange={e => props.chooseOpt(e)}
                      inputProps={{"aria-label": index}}
                    />
                    <div className="opts"> {item} </div>
                  </label>
                ))}
                <Button variant="contained" className="submit-btn" type="submit">
                  <FormattedMessage id="audi.submit" />
                </Button>
              </form>
            </Fragment>
          )
        ) : (
          <Wait {...props} />
        )
      ) : (
        <div className="heading-container">
          <div className="heading">{props.slds[props.curSldIndex].heading}</div>
          <Button
            variant="contained"
            size="large"
            className="reaction-icons"
            id="reaction-laugh"
            onClick={() => addReaction("laugh")}>
            <FontAwesomeIcon icon={["far", "laugh-squint"]} size="2x" />
          </Button>
        </div>
      )}
    </div>
  );
};

const Wait = props => {
  return (
    <div className="wait">
      <FormattedMessage id="audi.wait" />
    </div>
  );
};
