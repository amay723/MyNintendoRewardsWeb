import { useState, useEffect } from 'react'
import { Toast } from 'react-bootstrap'
import TimeAgo from 'react-timeago'
import { messaging } from '../../firebase'
import './Toasts.css'

interface ToastData {
    timestamp: number;
    id: number;
    data: {
        title: string;
        body: string;
    }
}

const Toasts: React.FC = () => {

    const [toastList, setToastList] = useState<ToastData[]>([])

    // On each new message, add toast notification
    useEffect( () => {
        if( messaging ) {
            return messaging.onMessage( payload => {
                const {
                    'google.c.a.c_id': id,
                    'google.c.a.ts': timestamp,
                } = payload.data
                const { title, body } = payload.notification

                const newList = [...toastList];
                newList.push({
                    timestamp: parseInt(timestamp) * 1000, // convert seconds to milliseconds
                    id, 
                    data: {
                        title, 
                        body,
                    }
                })
                setToastList( newList )
            });
          }
    }, [toastList])
    
    const removeToast = (toastId: number) => {
        // Find item to delete
        const toastIdx = toastList.map( toast => toast.id ).indexOf(toastId);
        // copy original list to temp var
        const newToastList = [...toastList]
        // remove item from copied list
        newToastList.splice(toastIdx, 1)
        
        setToastList( newToastList )
    }

    return (
        <div className="toasts">
            {  toastList.map( toast => (
                <Toast 
                    key={toast.id} 
                    show={true} 
                    onClose={ () => removeToast(toast.id) }
                >
                    <Toast.Header>
                        <strong>{toast.data.title}</strong>
                        <small>
                            <TimeAgo date={new Date(toast.timestamp)} />
                        </small>
                    </Toast.Header>
                    <Toast.Body>{toast.data.body}</Toast.Body>
                </Toast>
            ))

            }
        </div>
    )
}


export default Toasts