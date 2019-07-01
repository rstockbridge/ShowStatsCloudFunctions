'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.deleteUserAuthentication = functions.https.onCall((data, context) => {
    const user = context.auth.uid;

    return admin.auth().deleteUser(user)
        .then(() => {
            console.log("User authentication record deleted");
            return Promise.resolve();
        })
        .catch((error) => { 
            console.error("Error while trying to delete the user: ", error)
            return Promise.reject(error);
        });    
});

/**
 * Run once a day at midnight
 * Manually run the task here https://console.cloud.google.com/cloudscheduler
 */
exports.deleteUserData = functions.pubsub.schedule('every day 00:00').onRun(async context => {
    // Fetch all user details.
    const activeUsers = await getActiveUsers();

    admin.firestore().collection("users").get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                const docRef = doc.ref;
                var deleteFlag = true;

                activeUsers.forEach((activeUser, index) => {
                    // at most one active user will match this document
                    if (activeUser.uid === docRef.id) {
                        deleteFlag = false;
                    }
                });

                if(deleteFlag) {
                    deleteDocument(docRef);
                }
            });
            return Promise.resolve();
        })
        .catch(error => {
            console.log("Error getting documents: ", error);
            return Promise.reject(error);
        });
});

function logActiveUsers(activeUsers) {
    activeUsers.forEach((item, index) => {
        console.log(item.uid, index);
    });
}

async function getActiveUsers(users = [], nextPageToken) {
    const result = await admin.auth().listUsers(1000, nextPageToken);
    const activeUsers = result.users;
  
    // Concat with list of previously found active users if there was more than 1000 users.
    users = users.concat(activeUsers);
  
     // If there are more users to fetch we fetch them.
    if (result.pageToken) {
        return getActiveUsers(users, result.pageToken);
    }
  
    return users;
}

function deleteDocument(docRef) {
    docRef.delete()
        .then(() => {
            console.log("Document ", docRef.id, " successfully deleted!");
            return Promise.resolve();
        })
        .catch((error) => {
            console.error("Error removing document ", docRef.id, ": ", error);
            return Promise.reject(error);
        })
}