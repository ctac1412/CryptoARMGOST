import { OrderedMap } from "immutable";
import {
  FAIL, LOCATION_CERTIFICATES, START, SUCCESS, URL_CMD_CERT_INFO,
} from "../constants";
import history from "../history";
import localize from "../i18n/localize";
import { CertificateModel } from "../reducer/certificates";
import store from "../store";
import { arrayToMap } from "../utils";
import { navigationLock, navigationUnlock } from "./globalLocks";
import { openWindow, postRequest } from "./urlCmdUtils";

function requestCertInfo(id: string, certificate: trusted.pki.Certificate) {
  return JSON.stringify({
    jsonrpc: "2.0",
    method: "certificateInfo.info",
    params: {
      id,
      // tslint:disable-next-line: object-literal-sort-keys
      hash: certificate.hash(),
      issuerFriendlyName: certificate.issuerFriendlyName,
      issuerName: certificate.issuerName,
      notAfter: certificate.notAfter,
      notBefore: certificate.notBefore,
      subjectFriendlyName: certificate.subjectFriendlyName,
      subjectName: certificate.subjectFriendlyName,
      status: trusted.utils.Csp.verifyCertificateChain(certificate),
      serial: certificate.serialNumber,
    },
  });
}

export function certificateInfo(certToView: string, id: string, url: string) {
  const certValue = Buffer.from(certToView);
  const cert = new trusted.pki.Certificate();

  try {
    cert.import(certValue, trusted.DataFormat.PEM);
  } catch (e) {
    $(".toast-url-cmd-cert-info-params-fail-err-descr").remove();
    Materialize.toast(localize("UrlCommand.certificate_load_error", window.locale),
      3000, "toast-url-cmd-cert-info-params-fail-err-descr");
    return;
  }

  certInfoStart(cert, id, url);
  navigationLock();
  openWindow(LOCATION_CERTIFICATES, "");
}

export function certInfoStart(cert: trusted.pki.Certificate, id: string, url: string) {
  store.dispatch({
    type: URL_CMD_CERT_INFO + START,
    // tslint:disable-next-line: object-literal-sort-keys
    payload: {
      certToProcess: cert,
      certToProcessPkiItemInfo: certificateToPkiItemInfo(cert),
      id,
      operation: URL_CMD_CERT_INFO,
      url,
    },
  });
}

export function certInfoSuccess() {
  history.goBack();
  navigationUnlock();
  store.dispatch({ type: URL_CMD_CERT_INFO + SUCCESS });
  $(".toast-url-cmd-cert-info-success").remove();
  Materialize.toast(localize("UrlCommand.cert_info_success", window.locale),
    3000, "toast-url-cmd-cert-info-success");
}

export function certInfoFail() {
  history.goBack();
  navigationUnlock();
  store.dispatch({ type: URL_CMD_CERT_INFO + FAIL });
  $(".toast-url-cmd-cert-info-fail").remove();
  Materialize.toast(localize("UrlCommand.cert_info_fail", window.locale),
    3000, "toast-url-cmd-cert-info-fail");
}

export function sendCertificateInfo(cert: trusted.pki.Certificate, cmdUrl: string, cmdId: string) {
  postRequest(cmdUrl, requestCertInfo(cmdId, cert)).then(
    (data) => {
      certInfoSuccess();
    },
    (error) => {
      certInfoFail();
      // tslint:disable-next-line: no-console
      console.log("Error sending certificate info command with id " + cmdId
        + ". Error description: " + error);
    },
  );
}

const certificateToPkiItemInfo = (certValue: trusted.pki.Certificate) => {
  if (certValue) {
    let status = false;
    try {
      status = trusted.utils.Csp.verifyCertificateChain(certValue);
    } catch (e) {
      status = false;
    }

    try {
      return {
        hash: certValue.thumbprint,
        issuerFriendlyName: certValue.issuerFriendlyName,
        key: "",
        notAfter: certValue.notAfter,
        notBefore: certValue.notAfter,
        object: certValue,
        organizationName: certValue.organizationName,
        provider: "CRYPTOPRO",
        publicKeyAlgorithm: certValue.publicKeyAlgorithm,
        serial: certValue.serialNumber,
        signatureAlgorithm: certValue.signatureAlgorithm,
        signatureDigestAlgorithm: certValue.signatureDigestAlgorithm,
        subjectFriendlyName: certValue.subjectFriendlyName,
        subjectName: certValue.subjectName,
        // --------
        // tslint:disable-next-line: object-literal-sort-keys
        category: "MY",
        format: "DER",
        id: "CRYPTOPRO_MY_" + certValue.thumbprint,
        issuerName: certValue.issuerName,
        type: "CERTIFICATE",
        status,
        verified: true,
      };
    } catch (e) {
      // tslint:disable-next-line: no-console
      console.log("Error transform pki.Cetificate to PkiItem", e);
      return undefined;
    }
  } else {
    return undefined;
  }
};

export function pkiCertToCertMap(certToProcessPkiItemInfo: any): any {
  if (certToProcessPkiItemInfo) {
    return OrderedMap({}).merge(arrayToMap([certToProcessPkiItemInfo], CertificateModel));
  } else {
    return OrderedMap({});
  }
}
