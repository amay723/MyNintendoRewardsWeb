import { useState } from 'react'
import { Modal, Button } from 'react-bootstrap'
import './Footer.css'


const Footer: React.FC = () => {

    // Modal
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <>
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Problem with Notifications?</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p>Check your browser's settings to see if your notification settings are set to "Allow" for this site.</p>
                    <p><strong>Windows Users:</strong> Open <code>Settings -&gt; System -&gt; Notifications &amp; Actions</code>. Scroll down to the "Get Notifications from these Senders" section and verify your browser is set to "On".</p>
                    <p><strong>Mac Users:</strong> Open <code>System Preferences -&gt; Notifications</code> and make sure your browser has notifications enabled.</p>
                    <p><em><u>Note</u>: Not all browsers support notifications. Notifications will not work in incognito mode.</em></p>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            <div className="footer">
                <span>
                    <button onClick={handleShow}>
                        <small><u>Notifications not Showing?</u></small>
                    </button>
                </span>
                <span>
                    <a href="https://github.com/amay723/MyNintendoRewardsWeb" target="_blank" rel="noreferrer">
                        <svg className="octicon octicon-mark-github v-align-middle" viewBox="0 0 16 16" version="1.1" width="32" aria-hidden="true">
                            <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                        </svg>
                    </a>
                </span>
            </div>
        </>
    )
}

export default Footer