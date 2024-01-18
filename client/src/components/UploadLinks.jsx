import styles from "../css/styles.module.css";

import { useContext } from "react";
import { FileContext } from "../context/FileContext";
const UploadLinks = () => {
  const { uploads } = useContext(FileContext);

  const links = uploads?.map((file, idx) => {
    return (
      <div key={idx + 1} className={styles.uppy_link}>
        <a
          alt={file.id}
          href={file.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          {file.name}
        </a>
      </div>
    );
  });

  if (uploads)
    return (
      <div className={styles.uppy_links}>
        <h3>Successful Files:</h3>
        {links}
      </div>
    );
};

export default UploadLinks;
