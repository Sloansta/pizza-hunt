// create variable to hold db connection 
let db;

// establish a connection to indexedDB database called 'pizza_hunt' and set it to version 1
const request = indexedDB.open('pizza_hunt', 1);

request.onupgradeneeded = function(event) {
    // save a reference to the database
    const db = event.target.result;

    db.createObjectStore('new_pizza', { autoIncrement: true });
};

// upon a successful requeset
request.onsuccess = function(event) {
    // when db is  successfully created with its object store
    db = event.target.result;

    // check if app is online, if so, run uploadPizza() function to send all local dv data to api
    if(navigator.onLine)
        uploadPizza()

};

// upon an unsuccessful request
request.onerror = function(event) {
    // log the error here
    console.log(event.target.errorCode);
};

// this function will be executed if we attempt to submit a new pizza and there is no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permission
    const transaction = db.transaction(['new_pizza'], 'readwrite');

    // access the object store for 'new_pizzaz'
    const pizzaObjectStore = transaction.objectStore('new_pizza');

    // add record to store with add method
    pizzaObjectStore.add(record);
}

function uploadPizza() {
  // open a transaction on the db
  const transaction = db.transaction(["new_pizza"], "readwrite");

  // access the object store
  const pizzaObjectStore = transaction.objectStore("new_pizza");

  // get all records from store and set to a variable
  const getAll = pizzaObjectStore.getAll();

  // upon a successful .getAll() execution, run this function
  getAll.success = function () {
    // if there was data in indexedDb's store, send it to the api server
    if (getAll.result.length > 0) {
      fetch("/api/pizzas", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverRes) => {
          if (serverRes.message) throw new Error(serverRes);

          // open one more transaction
          const transaction = db.transaction(["new_pizza"], "readwrite");

          // access the new_pizza object store
          const pizzaObjectStore = transaction.objectStore("new_pizza");

          // clear all items in the store
          pizzaObjectStore.clear();

          alert("All saved pizza has been submitted!");
        })
        .then((err) => console.log(err));
    }
  };
}

// listen for app coming back online 
window.addEventListener('online', uploadPizza);