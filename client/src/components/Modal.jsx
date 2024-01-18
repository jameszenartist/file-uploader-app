import styles from "../css/styles.module.css";

import { useContext } from "react";
import { FileContext } from "../context/FileContext";
import Form from "../components/Form";

function Modal({ modalType }) {
  const { isOpen, closeModal } = useContext(FileContext);

  if (isOpen[modalType]) {
    return (
      <>
        <div className={`${styles.modal}`}>
          <h3 style={{ textTransform: "capitalize" }}>{modalType} Component</h3>
          <br />
          <Form modalType={modalType} />
          <button
            className={`${styles.closeBtn}`}
            onClick={() => closeModal(`${modalType}`)}
          >
            &times;
          </button>
        </div>
      </>
    );
  }
}

export default Modal;
