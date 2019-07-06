'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.deleteUserAuthentication = functions.https.onCall((data, context) => {
    const user = context.auth.uid;

    return admin.auth().deleteUser(user)
        .then(() => {
            console.log("User authentication record deleted");
            return;
        })
        .catch((error) => { 
            console.error("Error while trying to delete the user: ", error);
            return;
        });    
});

/**
 * Run once a day at midnight
 * Manually run the task here https://console.cloud.google.com/cloudscheduler
 */
exports.deleteUserData = functions.pubsub.schedule('every day 00:00').onRun(async context => {
	// Fetch all user details.
    const activeUsers = await getActiveUsers();

    return admin.firestore().collection("users").get()
        	.then(snapshot => {
    			return Promise.all(getDeletePromises(snapshot, activeUsers));
        	});
});

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

function getDeletePromises(snapshot, activeUsers) {
	var docRefsToDelete = new Array();

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
            docRefsToDelete.push(docRef);
        }
    });

    const deletePromises = docRefsToDelete.map((docRef) => {
  		return docRef.delete()
        	        .then(() => {
                        console.log("Document ", docRef.id, " successfully deleted!");
                        return;
                    })
                    .catch((error) => {
                        console.error("Error removing document ", docRef.id, ": ", error);
                        return; // don't pass on error to allow other deletePromises to succeed
                    });
                });

    return deletePromises;
}