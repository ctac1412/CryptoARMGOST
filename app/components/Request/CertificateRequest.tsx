import noUiSlider from "nouislider";
import PropTypes from "prop-types";
import React from "react";
import ReactDOM from "react-dom";
import { connect } from "react-redux";
import { uuid } from "../../utils";
import KeyParameters from "./KeyParameters";
import SubjectNameInfo from "./SubjectNameInfo";

interface ICertificateRequestState {
  algorithm: string;
  cn: string;
  containerName: string;
  country: string;
  email: string;
  generateNewKey: boolean;
  inn?: string;
  keyLength: number;
  locality: string;
  organization: string;
  province: string;
  snils?: string;
  step: number;
  template: string;
}

interface ICertificateRequestProps {
  onCancel?: () => void;
}

class CertificateRequest extends React.Component<ICertificateRequestProps, ICertificateRequestState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: any) {
    super(props);

    this.state = {
      algorithm: "RSA",
      cn: "",
      containerName: uuid(),
      country: "RU",
      email: "",
      generateNewKey: true,
      inn: "",
      keyLength: 1024,
      locality: "",
      organization: "",
      province: "",
      snils: "",
      step: 1,
      template: "default",
    };
  }

  componentDidMount() {
    const self = this;
    const slider = document.getElementById("key-length-slider");

    if (slider) {
      if (slider.noUiSlider) {
        slider.noUiSlider.destroy();
      }

      noUiSlider.create(slider, {
        format: wNumb({
          decimals: 0,
        }),
        range: {
          "min": 512,
          "25%": 1024,
          "50%": 2048,
          "75%": 3072,
          "max": 4096,
        },
        snap: true,
        start: 1024,
      });

      slider.noUiSlider.on("update", (values, handle) => {
        self.setState({ keyLength: values[handle] });
      });
    }
  }

  render() {
    const { localize, locale } = this.context;
    const { algorithm, cn, containerName, country, email, inn, generateNewKey, keyLength,
      locality, organization, province, snils, step, template } = this.state;

    return (
      <div>
        {
          (step === 1) ?
            <div className="modal-body overflow">
              <br />
              <div className="row">
                <div className="col s6 m6 l6 content-item-height">
                  <div className="content-wrapper z-depth-1">
                    <KeyParameters
                      algorithm={algorithm}
                      containerName={containerName}
                      generateNewKey={generateNewKey}
                      keyLength={keyLength}
                      handleAlgorithmChange={this.handleAlgorithmChange}
                      handleGenerateNewKeyChange={this.handleGenerateNewKeyChange}
                      handleInputChange={this.handleInputChange}
                    />
                  </div>
                </div>
                <div className="col s2 offset-s7">
                  <a className={"waves-effect waves-light btn modal-close"} onClick={this.handelCancel}>{localize("Common.cancel", locale)}</a>
                </div>
                <div className="col s2">
                <a className={"waves-effect waves-light btn"} onClick={this.handleNextStep}>{localize("Common.next", locale)}</a>
                </div>
              </div>
            </div>
            : null
        }
        {
          (step === 2) ?
            <div className="modal-body overflow">
              <br />
              <div className="row">
                <SubjectNameInfo
                  template={template}
                  cn={cn}
                  email={email}
                  organization={organization}
                  locality={locality}
                  province={province}
                  country={country}
                  inn={inn}
                  snils={snils}
                  handleCountryChange={this.handleCountryChange}
                  handleTemplateChange={this.handleTemplateChange}
                  handleInputChange={this.handleInputChange}
                />
                <div className="col s2 offset-s7">
                  <a className={"waves-effect waves-light btn "} onClick={this.handleBackStep}>{localize("Common.back", locale)}</a>
                </div>
                <div className="col s2">
                  <a className={"waves-effect waves-light btn "} onClick={this.handleBackStep}>{localize("Common.back", locale)}</a>
                </div>
              </div>
            </div>
            : null
        }
      </div>
    );
  }

  handelCancel = () => {
    const { onCancel } = this.props;

    if (onCancel) {
      onCancel();
    }
  }

  handleNextStep = () => {
    this.setState({ step: this.state.step + 1 });
  }

  handleBackStep = () => {
    this.setState({ step: this.state.step - 1 });
  }

  handleGenerateNewKeyChange = () => {
    this.setState({ generateNewKey: !this.state.generateNewKey });
  }

  handleTemplateChange = (ev: any) => {
    this.setState({ template: ev.target.value });
  }

  handleAlgorithmChange = (ev: any) => {
    this.setState({ algorithm: ev.target.value });
  }

  handleInputChange = (ev: any) => {
    const target = ev.target;
    const name = target.name;

    this.setState({ [name]: ev.target.value });
  }

  handleCountryChange = (ev: any) => {
    ev.preventDefault();
    this.setState({ country: ev.target.value });
  }
}

export default CertificateRequest;
