import React, { useRef, useState } from 'react';
import './App.css';

import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

const firebaseConfig = {
  // firestore config
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const firestore = firebase.firestore();

function App() {
  // if signed in user = object, else user = null
  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <header>
        <h1>React Chat App</h1>
        <SignOut />
      </header>
        
      <section>
        {user ? <ChatRoom /> : <SignIn />}
      </section>
    </div>
  );
}

function SignIn() {
  // allow Google connection popup to sign in
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  }
  return (
    <button className="sign-in" onClick={signInWithGoogle}>Sign in with Google</button>
  );
}

function SignOut() {
  // if there is a current user => display button who trigger signOut method
  return auth.currentUser && (
    <button className="sign-out" onClick={() => auth.signOut()}>Sign Out</button>
  );
}

function ChatRoom() {
  const dummy = useRef();
  // reference a firestore collection
  const messagesRef = firestore.collection('messages');
  // query documents in a collection (sort by time stamp & limited to 25)
  const query = messagesRef.orderBy('createdAt').limit(25);
  // make the query & listen data in real time with a hook
  // return an array of objects, each object = chat message in DB
  const [messages] = useCollectionData(query, {idField: 'id'});
  // use a hook go get the actual value of the form
  const [formValue, setFormValue] = useState('');
  // event endler that 
  const sendMessage = async(e) => {
    // prevent page refresh when the form is submitted
    e.preventDefault();
    // get data from the current user
    const { uid, photoURL } = auth.currentUser;
    // create a new document in the firestore DB
    await messagesRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL
    });
    // and reset our form value to an empty string
    setFormValue('');

    dummy.current.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    // map the array of messages & for each use a dedicated ChatMessage component 
    <>
      <main>
        {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
        <span ref={dummy}></span>
      </main>

      <form onSubmit={sendMessage}>
        <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="Type your message here..." />
        <button type="submit" disabled={!formValue}>Submit</button>
      </form>
    </>
  );
}

function ChatMessage(props) {
  // show the actual text by accessing it from the props.message
  const { text, uid, photoURL} = props.message;

  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';

  return (
    <>
      <div className={`message ${messageClass}`}>
        <img src={photoURL} alt="profile" />
        <p>{text}</p>
      </div>
    </>
  );
}

export default App;
