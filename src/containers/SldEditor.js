import React, {useEffect, useRef, Fragment, useState} from "react";
import {Router, Switch, Route, Link} from "react-router-dom";
import {useFirestore} from "react-redux-firebase";
import {createBrowserHistory} from "history";
import {FormattedMessage} from "react-intl";
import Chart from "react-google-charts";

import QRCode from "qrcode.react";
import "./sldEditor.css";
import ZhInput from "../components/ZhInput/ZhInput";

// FontAwesome Setting
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {library} from "@fortawesome/fontawesome-svg-core";
import {
  faLaughSquint,
  faHandPointRight,
  faChartBar
} from "@fortawesome/free-regular-svg-icons";
import {
  faTrashAlt,
  faCopy,
  faUser,
  faChartPie,
  faQrcode
} from "@fortawesome/free-solid-svg-icons";
library.add(
  faLaughSquint,
  faTrashAlt,
  faCopy,
  faUser,
  faHandPointRight,
  faChartBar,
  faChartPie,
  faQrcode
);
// Material UI
import AddIcon from "@material-ui/icons/Add";
import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CloseIcon from "@material-ui/icons/Close";
import SwitchBtn from "@material-ui/core/Switch";

const history = createBrowserHistory();

const SldEditor = props => {
  const db = useFirestore();
  const userId = props.userId;
  const projId = props.projId;

  const keydownHandler = e => {
    if (e.target.tagName !== "INPUT") {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        nextSld();
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        lastSld();
      }
    }
  };

  const selectSld = selIndex => {
    if (selIndex !== props.curSldIndex) {
      return db
        .collection("users")
        .doc(userId)
        .collection("projects")
        .doc(projId)
        .update({curSldIndex: selIndex})
        .then(() => {
          if (selIndex === 0) {
            history.push(`${props.match.url}`);
          } else {
            history.push(`${props.match.url}/${selIndex}`);
          }
        });
    }
  };

  const nextSld = () => {
    if (props.curSldIndex < props.slds.length - 1) {
      return db
        .collection("users")
        .doc(userId)
        .collection("projects")
        .doc(projId)
        .update({curSldIndex: props.curSldIndex + 1})
        .then(() => {
          if (!document.fullscreenElement) {
            history.push(`${props.match.url}/${props.curSldIndex + 1}`);
          }
        });
    }
  };

  const lastSld = () => {
    if (props.curSldIndex > 0) {
      db.collection("users")
        .doc(userId)
        .collection("projects")
        .doc(projId)
        .update({curSldIndex: props.curSldIndex - 1})
        .then(() => {
          if (!document.fullscreenElement) {
            if (props.curSldIndex - 1 === 0) {
              history.push(`${props.match.url}`);
            } else {
              history.push(`${props.match.url}/${props.curSldIndex - 1}`);
            }
          }
        });
    }
  };

  // const fullScreenClicking = () => {
  //   console.log("fullscreen Clicking", props.slds, props.curSldIndex);
  //   if (props.slds !== undefined && props.curSldIndex !== undefined) {
  //     nextSld();
  //   }
  // };

  let [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const monitorFullscreen = () => {
      if (document.fullscreenElement) {
        setIsFullscreen(true);
        // document.addEventListener("click", fullScreenClicking);
      } else {
        setIsFullscreen(false);
      }
    };

    document.addEventListener("fullscreenchange", monitorFullscreen);

    return () => {
      document.removeEventListener("fullscreenchange", monitorFullscreen);
      // document.removeEventListener("click", fullScreenClicking);
    };
  });

  useEffect(() => {
    let url = props.location.pathname;
    let urlSplitArr = url.split("/");
    // Each time enter this page, the UseEffect function will check the URL path
    if (/^\d{1,2}$/.test(urlSplitArr[urlSplitArr.length - 1])) {
      // if the URL path contained page number info, this will update the curSldIndex according to the URL path
      history.push(`${props.match.url}/${parseInt(urlSplitArr[urlSplitArr.length - 1])}`);
      db.collection("users")
        .doc(userId)
        .collection("projects")
        .doc(projId)
        .update({
          curSldIndex: parseInt(urlSplitArr[urlSplitArr.length - 1])
        });
    } else {
      // if the URL path does not contained page number info, this will update the curSldIndex to 0 (i.e. the first page)
      history.push(`${props.match.url}`);
      db.collection("users")
        .doc(userId)
        .collection("projects")
        .doc(projId)
        .update({
          curSldIndex: 0
        });
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", keydownHandler);
    return () => {
      document.removeEventListener("keydown", keydownHandler);
    };
  }, [keydownHandler]);

  return (
    <Router basename={process.env.PUBLIC_URL} history={history}>
      <div className="container">
        <div id="sld-selector">
          <SldsItems {...props} selectSld={selectSld} />
          <AddSldBtn {...props} selectSld={selectSld} />
        </div>
        <Switch>
          <SldPage {...props} isFullscreen={isFullscreen} nextSld={nextSld} />
        </Switch>
      </div>
      <DelSld {...props} selectSld={selectSld} />
    </Router>
  );
};
export default SldEditor;

const SldsItems = props => {
  const db = useFirestore();
  const userId = props.userId;
  const projId = props.projId;
  let [hovered, setHovered] = useState(null);

  if (!props.slds) {
    return <div>Loading</div>;
  }

  const copySld = index => {
    let newSld = {...props.slds[index]};
    let t = Date.now();
    newSld.id = t;
    newSld.lastEdited = t;
    newSld.result = props.slds[index].result.map(item => {
      if (item !== "") {
        item = "";
      }
      return item;
    });
    props.slds.splice(index + 1, 0, newSld);
    console.log(newSld, props.slds);

    // console.log(props.slds[index], props.slds[index + 1]);
    db.collection("users")
      .doc(userId)
      .collection("projects")
      .doc(projId)
      .update({lastEdited: t, slds: props.slds})
      .then(() => {
        // Add a responded audi container to the new slide
        props.respondedAudi[t] = [];
        db.collection("invitation")
          .doc(projId)
          .update({respondedAudi: props.respondedAudi});
      });
  };

  return props.slds.map((item, index) => {
    let path = null;
    let sldClass = null;

    // Compose path according to slide index
    index === 0 ? (path = `${props.match.url}`) : (path = `${props.match.url}/${index}`);

    // Highlight current selected slide by different class name according to db curSldIndex
    if (index === parseInt(props.curSldIndex)) {
      sldClass = "sld-item sld-item-selected";
    } else {
      sldClass = "sld-item";
    }

    let optionLi = null;
    if (item.opts) {
      optionLi = item.opts.map((opt, index) => {
        return <li key={index}>{opt}</li>;
      });
    }

    let copyBtnClass = "sld-copy-btn hide-tool";
    let delBtnClass = "trash-bin sld-item-del hide-tool";
    if (index === hovered) {
      copyBtnClass = "sld-copy-btn";
      delBtnClass = "trash-bin sld-item-del";
    }

    return (
      <div
        className={sldClass}
        key={index}
        onMouseOver={() => setHovered(index)}
        onMouseLeave={() => setHovered(null)}>
        <div className="sld-item-title">
          <div>{index + 1}</div>
          <FontAwesomeIcon
            icon={["fas", "copy"]}
            className={copyBtnClass}
            onClick={() => copySld(index)}
          />
          <FontAwesomeIcon
            icon={["fas", "trash-alt"]}
            className={delBtnClass}
            onClick={() => props.showOverlay("confirmDel", index)}
          />
        </div>

        <Link to={path}>
          <div
            className="sld"
            onClick={() => {
              props.selectSld(index);
            }}>
            {item.sldType === "multiple-choice" ? (
              <div className="sld-item-content">
                <div className="sld-item-header">{item.qContent}</div>
                <div className="sld-item-type">
                  <FontAwesomeIcon
                    icon={["far", "chart-bar"]}
                    className="sld-item-icon"
                    size="lg"
                  />
                  <div className="sld-item-text">
                    <FormattedMessage id="edit.multiple-selection" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="sld-item-content heading-render-container">
                <div className="sld-item-header">{item.heading}</div>
                {item.hasQRCode ? (
                  <FontAwesomeIcon icon={["fas", "qrcode"]} className="sld-item-icon" />
                ) : null}
                <div className="sld-item-text">
                  <FormattedMessage id="edit.heading-page" />
                </div>
              </div>
            )}
          </div>
        </Link>
      </div>
    );
  });
};

const SldPage = props => {
  if (!props.slds) {
    return <div>Loading</div>;
  }

  return props.slds.map((sld, index) => {
    let path = null;
    index === 0
      ? (path = {exact: true, path: `${props.match.url}`})
      : (path = {path: `${props.match.url}/${index}`});

    return (
      <Route {...path} key={index}>
        <SldPageRoute
          {...props}
          sld={sld}
          isFullscreen={props.isFullscreen}
          nextSld={props.nextSld}
        />
        {sld.sldType === "multiple-choice" ? (
          <MultiSelEditor {...props} sld={sld} sldIndex={index} />
        ) : (
          <HeadingSldEditor {...props} sld={sld} sldIndex={index} />
        )}
      </Route>
    );
  });
};

const SldPageRoute = props => {
  let optsArray = props.slds[props.curSldIndex].opts;
  let resultArray = props.slds[props.curSldIndex].result;
  let resultType = props.slds[props.curSldIndex].resType;
  let optResult = null;
  const colors = [
    "#00b894",
    "#ffeaa7",
    "#fab1a0",
    "#0984e3",
    "#00cec9",
    "#ff7675",
    "#6c5ce7",
    "#b2bec3",
    "#fd79a8",
    "#badc58",
    "#686de0",
    "#f0932b",
    "#22a6b3",
    "#f8c291",
    "#60a3bc",
    "#b71540",
    "#0a3d62",
    "#D6A2E8",
    "#1B9CFC",
    "#EAB543"
  ];

  let pieColors = null;
  if (optsArray !== "") {
    pieColors = props.slds[props.curSldIndex].opts.map((opt, index) => {
      return {color: colors[index]};
    });
  }

  if (optsArray !== "") {
    optResult = props.slds[props.curSldIndex].opts.map((opt, index) => {
      let result = resultArray[index] !== "" ? resultArray[index] : 0;
      return [`${opt}`, result, colors[index], result];
    });
  } else {
    optResult = null;
  }

  let data = [
    [
      "Options",
      "Result",
      {role: "style"},
      {
        sourceColumn: 0,
        role: "annotation",
        type: "string",
        calc: "stringify"
      }
    ]
  ].concat(optResult);

  let barOptions = {
    legend: {position: "none"},
    chartArea: {width: "80%", height: "70%"},
    bar: {groupWidth: "68%"},
    animation: {
      duration: 1000,
      easing: "out",
      startup: true
    },
    vAxis: {
      gridlines: {count: 0},
      minorGridlines: {count: 0},
      ticks: []
    },
    hAxis: {
      textStyle: {
        fontSize: 20
      }
    },
    annotations: {
      textStyle: {
        fontSize: 20,
        bold: true
      }
    }
  };

  let pieOptions = {
    slices: pieColors,
    animation: {
      duration: 1000,
      easing: "out",
      startup: true
    },
    is3D: false,
    pieHole: 0,
    legend: {
      position: "labeled",
      textStyle: {
        fontSize: 16
      }
    },
    pieSliceText: "value",
    pieSliceTextStyle: {
      color: "#333",
      fontSize: 16
    }
  };

  if (props.isFullscreen === true) {
    barOptions = {
      legend: {position: "none"},
      chartArea: {width: "80%", height: "70%"},
      bar: {groupWidth: "68%"},
      animation: {
        duration: 1000,
        easing: "out",
        startup: true
      },
      vAxis: {
        gridlines: {count: 0},
        minorGridlines: {count: 0},
        ticks: []
      },
      hAxis: {
        textStyle: {
          fontSize: 36
        }
      },
      annotations: {
        textStyle: {
          fontSize: 36,
          bold: true
        }
      }
    };
    pieOptions = {
      slices: pieColors,
      animation: {
        duration: 1000,
        easing: "out",
        startup: true
      },
      is3D: false,
      pieHole: 0,
      legend: {
        position: "labeled",
        textStyle: {
          fontSize: 36
        }
      },
      pieSliceText: "value",
      pieSliceTextStyle: {
        color: "#333",
        fontSize: 36
      }
    };
  }

  // To make sure the chart will be drawn only when there is an option exists
  let chart = null;
  if (optsArray !== "") {
    if (resultType === "bar-chart") {
      chart = (
        <Chart
          chartType="ColumnChart"
          width="100%"
          height="100%"
          data={data}
          options={barOptions}
        />
      );
    } else if (resultType === "pie-chart") {
      chart = (
        <Chart
          width="100%"
          height="100%"
          chartType="PieChart"
          loader={<div>Loading Chart</div>}
          data={data}
          options={pieOptions}
        />
      );
    }
  }

  let detailContainer = null;
  if (props.slds[props.curSldIndex].hasQRCode) {
    detailContainer = (
      <div className="qr-code">
        {/* different QRCode size depends on fullscreen or not */}
        {props.isFullscreen === false ? (
          <Fragment>
            <div className="scan-to-join">
              <FormattedMessage id="edit.scan-to-join" />
              <FontAwesomeIcon icon={["far", "hand-point-right"]} size="lg" />
            </div>
            <QRCode
              value={`https://conversa-a419b.firebaseapp.com/audi/${props.projId}`}
              size={230}
              imageSettings={{
                src:
                  "https://lh3.googleusercontent.com/ZgZLV4rnkakeFPtT14X_lz3BdDpv8kEQ6bzWvXgHw-Wj_WYqiPNSqkq2oUBBRMQiQePrmDmO6WBrRq7_bqFsQBvnTd1_vh4BVg7opHZRsvYUTRrgoL59qyzcflYMnmHy0NzjtngT4A=w400",
                x: null,
                y: null,
                height: 45,
                width: 45,
                excavate: true
              }}
            />
          </Fragment>
        ) : (
          <Fragment>
            <div className="fullscreenFontSize scan-to-join">
              <FormattedMessage id="edit.scan-to-join" />
              <FontAwesomeIcon icon={["far", "hand-point-right"]} size="lg" />
            </div>
            <QRCode
              value={`https://conversa-a419b.firebaseapp.com/audi/${props.projId}`}
              size={500}
              imageSettings={{
                src:
                  "https://lh3.googleusercontent.com/ZgZLV4rnkakeFPtT14X_lz3BdDpv8kEQ6bzWvXgHw-Wj_WYqiPNSqkq2oUBBRMQiQePrmDmO6WBrRq7_bqFsQBvnTd1_vh4BVg7opHZRsvYUTRrgoL59qyzcflYMnmHy0NzjtngT4A=w400",
                x: null,
                y: null,
                height: 100,
                width: 100,
                excavate: true
              }}
            />
          </Fragment>
        )}
      </div>
    );
  } else {
    detailContainer = (
      <div className="sub-heading-render">{props.slds[props.curSldIndex].subHeading}</div>
    );
  }

  const clickFullscreen = () => {
    if (
      props.isFullscreen === true &&
      props.slds !== undefined &&
      props.curSldIndex !== undefined
    ) {
      props.nextSld();
    }
  };

  return (
    <div className="center-wrap">
      <div className="center">
        <div id="current-sld-container">
          <div id="current-sld-border">
            <div id="current-sld" onClick={clickFullscreen}>
              {props.slds[props.curSldIndex].sldType === "multiple-choice" ? (
                <Fragment>
                  <div className="qus-div">{props.slds[props.curSldIndex].qContent}</div>
                  {chart}
                </Fragment>
              ) : (
                <div className="heading-render-container">
                  <div className="heading-render">
                    {props.slds[props.curSldIndex].heading}
                  </div>
                  <Fragment>{detailContainer}</Fragment>
                  <div className="reaction-icons">
                    <FontAwesomeIcon icon={["far", "laugh-squint"]} />
                    <span className="reaction-count">{props.reaction.laugh}</span>
                  </div>
                </div>
              )}
              <div className="member-info">
                <FontAwesomeIcon icon={["fas", "user"]} id="member-icon" />
                {props.involvedAudi.length}
              </div>
            </div>
          </div>
        </div>
        <ControlPanel {...props} />
      </div>
    </div>
  );
};

const AddSldBtn = props => {
  const db = useFirestore();
  const userId = props.userId;
  const projId = props.projId;
  const addSld = () => {
    const t = Date.now();
    db.collection("users")
      .doc(userId)
      .collection("projects")
      .doc(projId)
      .update({
        lastEdited: t,
        slds: [
          ...props.slds,
          {
            id: t,
            qContent: "",
            sldType: "heading-page",
            opts: "",
            resType: "bar-chart",
            result: "",
            heading: "",
            subHeading: "",
            hasQRCode: false
          }
        ]
      })
      .then(() => {
        // change selection focus to the new created slide
        props.selectSld(props.slds.length);
        // Add a responded audi container to the new slide
        props.respondedAudi[t] = [];
        db.collection("invitation")
          .doc(projId)
          .update({respondedAudi: props.respondedAudi});
      });
  };
  return (
    <Button variant="contained" id="add-sld-btn" onClick={addSld}>
      <AddIcon />
      <FormattedMessage id="edit.add-sld" />
    </Button>
  );
};

const DelSld = props => {
  const db = useFirestore();

  const deleteSld = index => {
    props.slds.splice(index, 1);

    db.collection("users")
      .doc(props.userId)
      .collection("projects")
      .doc(props.projId)
      .update({
        lastEdited: Date.now(),
        slds: props.slds
      })
      .then(() => {
        props.closeOverlay("confirmDel");
        // change selection focus to the last slide of the removed slide
        props.selectSld(index - 1);
      });
  };
  return (
    <div className={props.confirmDelOverlayClass}>
      <Card id="confirm-del">
        <CardContent>
          <div className="overlay-card-title">
            <FormattedMessage id="edit.confirm-del-sld" />
            <CloseIcon
              className="closeX"
              onClick={() => props.closeOverlay("confirmDel")}
            />
          </div>

          <div className="confirm-del-btns">
            <Button
              value="true"
              variant="contained"
              id="del-btn"
              onClick={() => deleteSld(props.delSldIndex)}>
              <FormattedMessage id="edit.del-sld" />
            </Button>
            <Button
              value="false"
              variant="contained"
              id="cancel-del-btn"
              onClick={() => props.closeOverlay("confirmDel")}>
              <FormattedMessage id="edit.cancel-del-sld" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Geneal Focus Back setting
// const UseFocus = () => {
//   const htmlElRef = useRef(null);
//   const setFocus = () => {
//     htmlElRef.current.focus();
//   };

//   return [htmlElRef, setFocus];
// };

const MultiSelEditor = props => {
  const db = useFirestore();
  const userId = props.userId;
  const projId = props.projId;

  const changeDiagramType = e => {
    let newSlds = props.slds.map((sld, index) => {
      if (index === props.curSldIndex) {
        sld.lastEdited = Date.now();
        sld.resType = e.target.value;
      }
      return sld;
    });

    db.collection("users")
      .doc(userId)
      .collection("projects")
      .doc(projId)
      .update({
        lastEdited: Date.now(),
        slds: newSlds
      });
  };
  return (
    <div className="edit-panel">
      <div className="diagram-type-selector">
        <div className="diagram-label">
          <FormattedMessage id="edit.diagram-type" />
        </div>
        <form name="diagram-type-form" id="diagram-type-form">
          <label className="diagram-type-group">
            <input
              type="radio"
              name="diagram-type-group"
              value="bar-chart"
              checked={props.sld.resType === "bar-chart"}
              onChange={e => {
                changeDiagramType(e);
              }}
            />
            <div>
              <FontAwesomeIcon
                icon={["far", "chart-bar"]}
                className="diagram-type-icon"
              />
              <div>
                <FormattedMessage id="edit.bar-chart" />
              </div>
            </div>
          </label>
          <label className="diagram-type-group">
            <input
              type="radio"
              name="diagram-type-group"
              value="pie-chart"
              checked={props.sld.resType === "pie-chart"}
              onChange={e => {
                changeDiagramType(e);
              }}
            />
            <div>
              <FontAwesomeIcon
                icon={["fas", "chart-pie"]}
                className="diagram-type-icon"
              />
              <div>
                <FormattedMessage id="edit.pie-chart" />
              </div>
            </div>
          </label>
        </form>
      </div>
      <QusInput {...props} />
      <label htmlFor="opt-input" className="edit-panel-label">
        <FormattedMessage id="edit.opt-label" />
      </label>
      <div className="input-group">
        <OptInputs {...props} />
      </div>
      <AddOptBtn {...props} />
    </div>
  );
};

const QusInput = props => {
  const db = useFirestore();
  const userId = props.userId;
  const projId = props.projId;

  const editQus = (value, props) => {
    let newSlds = props.slds.map((sld, index) => {
      if (index === props.sldIndex) {
        sld.lastEdited = Date.now();
        sld.qContent = value;
      }
      return sld;
    });

    db.collection("users")
      .doc(userId)
      .collection("projects")
      .doc(projId)
      .update({
        lastEdited: Date.now(),
        slds: newSlds
      });
  };

  return (
    <div className="input-group">
      <label htmlFor="qus-input" id="qus-input-group">
        <div className="edit-panel-label">
          <FormattedMessage id="edit.qus-label" />
        </div>
        <FormattedMessage id="edit.qus-input-placeholder" defaultMessage="Question">
          {placeholder => (
            <ZhInput
              {...props}
              id="qus-input"
              placeholder={placeholder}
              curValue={props.sld.qContent}
              useInnerValue={editQus}
            />
          )}
        </FormattedMessage>
      </label>
    </div>
  );
};

const OptInputs = props => {
  const db = useFirestore();
  const userId = props.userId;
  const projId = props.projId;
  // Get current rendering length
  const optsLength = useRef(props.sld.opts.length);
  const [forceUpdate, setForceUpdate] = useState(false);

  useEffect(() => {
    // If current rendering length is different with the length in db
    // then force input value update
    if (optsLength.current !== props.sld.opts.length) {
      setForceUpdate(true);
      // after force update, set the current rendering length with db length
      optsLength.current = props.sld.opts.length;
    } else {
      setForceUpdate(false);
    }
  });

  let optInputs = null;
  if (props.sld.opts !== "") {
    optInputs = props.sld.opts.map((opt, index) => {
      return (
        <OptInput
          {...props}
          key={index}
          opt={opt}
          optIndex={index}
          forceUpdate={forceUpdate}
        />
      );
    });
  }

  return <div id="opt-inputs">{optInputs}</div>;
};

const OptInput = props => {
  const db = useFirestore();
  const userId = props.userId;
  const projId = props.projId;

  const editOpt = (value, props) => {
    let newSlds = props.slds.map((sld, index) => {
      if (index === props.sldIndex) {
        sld.lastEdited = Date.now();
        sld.opts[props.optIndex] = value;
      }
      return sld;
    });

    db.collection("users")
      .doc(userId)
      .collection("projects")
      .doc(projId)
      .update({
        lastEdited: Date.now(),
        slds: newSlds
      });
  };

  return (
    <div className="opt-input-group">
      <FormattedMessage id="edit.option-placeholder" defaultMessage="option">
        {placeholder => (
          <ZhInput
            {...props}
            id={"opt-input" + props.optIndex}
            placeholder={`${placeholder} ${props.optIndex + 1}`}
            curValue={props.opt}
            useInnerValue={editOpt}
          />
        )}
      </FormattedMessage>
      <DelOptBtn {...props} optIndex={props.optIndex} />
    </div>
  );
};

const DelOptBtn = props => {
  const db = useFirestore();
  const userId = props.userId;
  const projId = props.projId;
  const deleteOpt = () => {
    let newSlds = props.slds.map((sld, index) => {
      if (index === props.sldIndex) {
        sld.lastEdited = Date.now();
        sld.opts.splice(props.optIndex, 1);
        sld.result.splice(props.optIndex, 1);
      }
      return sld;
    });

    db.collection("users")
      .doc(userId)
      .collection("projects")
      .doc(projId)
      .update({
        lastEdited: Date.now(),
        slds: newSlds
      });
  };
  return (
    <div className="delete-opt-btn" onClick={deleteOpt}>
      ✖
    </div>
  );
};

const AddOptBtn = props => {
  const db = useFirestore();
  const userId = props.userId;
  const projId = props.projId;
  const addOption = e => {
    e.preventDefault();

    let newSlds = props.slds.map((sld, index) => {
      if (index === props.sldIndex) {
        sld.lastEdited = Date.now();
        sld.opts !== "" ? sld.opts.push("") : (sld.opts = [""]);
        sld.result !== "" ? sld.result.push("") : (sld.result = [""]);
      }
      return sld;
    });

    db.collection("users")
      .doc(userId)
      .collection("projects")
      .doc(projId)
      .update({
        lastEdited: Date.now(),
        slds: newSlds
      });
  };

  return (
    <Button
      id="add-opt-btn"
      onClick={e => {
        addOption(e);
      }}>
      <AddIcon />
      <FormattedMessage id="edit.add-opt" />
    </Button>
  );
};

const ControlPanel = props => {
  const db = useFirestore();
  const userId = props.userId;
  const projId = props.projId;
  const changeSldType = e => {
    let newSlds = props.slds.map((sld, index) => {
      if (index === props.curSldIndex) {
        sld.lastEdited = Date.now();
        sld.sldType = e.target.value;
      }
      return sld;
    });

    db.collection("users")
      .doc(userId)
      .collection("projects")
      .doc(projId)
      .update({
        lastEdited: Date.now(),
        slds: newSlds
      });
  };

  return (
    <div className="control-panel">
      <div className="control-label">
        <FormattedMessage id="edit.sld-type" />
      </div>
      <form name="sld-type-form" id="sld-type-form">
        <label className="sld-type-group">
          <input
            type="radio"
            name="sld-type-group"
            value="heading-page"
            checked={props.sld.sldType === "heading-page"}
            onChange={e => {
              changeSldType(e);
            }}
          />
          <div className="sld-type-w-chart">
            <FontAwesomeIcon icon={["fas", "qrcode"]} className="sld-type-icon" />
            <div>
              <FormattedMessage id="edit.heading-label" />
            </div>
          </div>
        </label>
        <label className="sld-type-group">
          <input
            type="radio"
            name="sld-type-group"
            value="multiple-choice"
            checked={props.sld.sldType === "multiple-choice"}
            onChange={e => {
              changeSldType(e);
            }}
          />
          <div className="sld-type-w-chart">
            <FontAwesomeIcon icon={["far", "chart-bar"]} className="sld-type-icon" />
            <div>
              <FormattedMessage id="edit.multiple-choice" />
            </div>
          </div>
        </label>
      </form>
    </div>
  );
};

const HeadingSldEditor = props => {
  const db = useFirestore();
  const userId = props.userId;
  const projId = props.projId;

  const editHeading = (value, props) => {
    let newSlds = props.slds.map((sld, index) => {
      if (index === props.sldIndex) {
        sld.lastEdited = Date.now();
        sld.heading = value;
      }
      return sld;
    });

    db.collection("users")
      .doc(userId)
      .collection("projects")
      .doc(projId)
      .update({
        lastEdited: Date.now(),
        slds: newSlds
      });
  };

  const editSubHeading = (value, props) => {
    let newSlds = props.slds.map((sld, index) => {
      if (index === props.sldIndex) {
        sld.lastEdited = Date.now();
        sld.subHeading = value;
      }
      return sld;
    });

    db.collection("users")
      .doc(userId)
      .collection("projects")
      .doc(projId)
      .update({
        lastEdited: Date.now(),
        slds: newSlds
      });
  };

  const switchQRCode = () => {
    let newSlds = props.slds.map((sld, index) => {
      if (index === props.sldIndex) {
        sld.lastEdited = Date.now();
        if (sld.hasQRCode) {
          sld.hasQRCode = false;
        } else {
          sld.hasQRCode = true;
        }
      }
      return sld;
    });

    db.collection("users")
      .doc(userId)
      .collection("projects")
      .doc(projId)
      .update({
        lastEdited: Date.now(),
        slds: newSlds
      });
  };

  return (
    <div className="edit-panel">
      <label htmlFor="heading-input" id="heading-input-group">
        <div className="heading-label">
          <FormattedMessage id="edit.heading-label" />
        </div>
        <ZhInput
          {...props}
          id="heading-input"
          curValue={props.sld.heading}
          useInnerValue={editHeading}
        />
      </label>
      <label htmlFor="QRCode-switch" id="hQRCode-switch-group">
        <div className="edit-panel-label">
          <FormattedMessage id="edit.QRCode-switch-label" />
        </div>
        <SwitchBtn
          checked={props.sld.hasQRCode === true}
          onChange={switchQRCode}
          value={props.sld.hasQRCode}
          color="primary"
          inputProps={{"aria-label": "primary checkbox"}}
        />
      </label>
      <label htmlFor="heading-input" id="heading-input-group">
        <div className="edit-panel-label">
          <FormattedMessage id="edit.sub-heading-label" />
        </div>
        <ZhInput
          {...props}
          id="sub-heading-input"
          curValue={props.sld.subHeading}
          useInnerValue={editSubHeading}
        />
      </label>
    </div>
  );
};
