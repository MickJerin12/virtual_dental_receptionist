"use strict";

const functions = require("firebase-functions");
const { WebhookClient } = require("dialogflow-fulfillment");
const { Suggestion } = require("dialogflow-fulfillment");

//initialise the database
const admin = require("firebase-admin");
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "",
});

var new_patient_phone;
var inp_date;

process.env.DEBUG = "dialogflow:debug";

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(
  (request, response) => {
    const agent = new WebhookClient({ request, response });
    console.log(
      "Dialogflow Request headers: " + JSON.stringify(request.headers)
    );
    console.log("Dialogflow Request body: " + JSON.stringify(request.body));

    var id;
    var inp_phone;
    var inp_doc_name;
    var sample_phone = { value: "" };
    function welcome(agent) {
      inp_phone = agent.parameters.new_patient_phone;
      new_patient_phone = inp_phone;
      sample_phone.value = inp_phone;
      var name, phone, age, sex;
      var check = 0;

      return admin
        .database()
        .ref("Patients")
        .once("value")
        .then(function(snapshot) {
          snapshot.forEach(function(childSnapshot) {
            name = childSnapshot.val().Name;
            phone = childSnapshot.val().phno;
            age = childSnapshot.val().Age;
            sex = childSnapshot.val().Sex;

            if (inp_phone === phone) {
              agent.add(
                "Please verify your details! " +
                  " ," +
                  "Name: " +
                  name +
                  " ," +
                  "Phone number: " +
                  phone +
                  " ," +
                  "Sex: " +
                  sex +
                  " ," +
                  "Age: " +
                  age +
                  "  ," +
                  "What would you like to do? "
              );
              check = 1;
              agent.add(new Suggestion("My data is incorrect"));
              agent.add(new Suggestion("Cancel the Appointment"));
              agent.add(new Suggestion("postponed Appointment"));
            }
          });

          if (check === 0) {
            agent.add("You seems to be a new patient");
            agent.add(new Suggestion("Register as a new patient"));
          }
        });
    }

    function fallback(agent) {
      agent.add(`I didn't understand`);
      agent.add(`I'm sorry, can you try again?`);
    }
    function booking_appointment(agent) {
      var date = agent.parameters.date.split("T")[0];
      var issue = agent.parameters.issue;
      var t1 = agent.parameters.time.split("T")[1];
      var t2 = t1.split("+");
      var time = t2[0];
      var flag = 0;
      var doc = agent.parameters.doctor;
      var result1 = admin.database();
      return result1
        .ref("Patients")
        .once("value")
        .then(function(snapshot) {
          snapshot.forEach(function(childSnapshot) {
            var phone = childSnapshot.val().phno;
            var id1 = childSnapshot.val().Patient_Id;
            var leave_date = childSnapshot.val().Leave_date;
            var Doc_name = childSnapshot.val().Doc_name;
            if (doc === Doc_name && leave_date === date) {
              agent.add(
                "Sorry doctor is on leave that day! You can apply for another date"
              );
              agent.add(new Suggestion("Re-enter date"));
              flag = 1;
            } else if (new_patient_phone === phone && flag === 0) {
              result1
                .ref("Patients")
                .child(date)
                .child(doc)
                .child(id1)
                .child("Patient_ID")
                .set(id1);
              result1
                .ref("Patients")
                .child(date)
                .child(doc)
                .child(id1)
                .child("Booking_Date")
                .set(date);
              result1
                .ref("Patients")
                .child(date)
                .child(doc)
                .child(id1)
                .child("Booking_Time")
                .set(time);
              result1
                .ref("Patients")
                .child(date)
                .child(doc)
                .child(id1)
                .child("Doc_Name")
                .set(doc);
              result1
                .ref("Patients")
                .child(date)
                .child(doc)
                .child(id1)
                .child("issue_of_the_patient")
                .set(issue);
              result1
                .ref("Patients")
                .child("Email")
                .child(id1)
                .child("Booking_Date")
                .set(date);
              result1
                .ref("Patients")
                .child("Email")
                .child(id1)
                .child("Booking_Time")
                .set(time);
              result1
                .ref("Patients")
                .child("Email")
                .child(id1)
                .child("Doctor_Name")
                .set(doc);
              result1
                .ref("Patients")
                .child("Email")
                .child(id1)
                .child("Issue_of_the_patient")
                .set(issue);
              result1
                .ref("Patients")
                .child("Email")
                .child(id1)
                .child("phone_number")
                .set(new_patient_phone);
              agent.add(
                "Your appointment has been booked with " +
                  doc +
                  " " +
                  "on " +
                  date +
                  " " +
                  "at " +
                  time +
                  " " +
                  "Thank you!"
              );
            }
          });
        });
    }
    function change(agent, id1) {
      return admin
        .database()
        .ref("Patients")
        .child(inp_date)
        .child(inp_doc_name)
        .child(id1)
        .remove();
    }

    function cancel_appointment(agent) {
      var result1 = admin.database();
      inp_date = agent.parameters.date_of_app.split("T")[0];
      inp_doc_name = agent.parameters.doc_name;
      return result1
        .ref("Patients")
        .once("value")
        .then(function(snapshot) {
          snapshot.forEach(function(childSnapshot) {
            var phone = childSnapshot.val().phno;
            var id1 = childSnapshot.val().Patient_Id;
            if (new_patient_phone === phone) {
              change(agent, id1);
              agent.add(
                "Your appointment with Dr." +
                  inp_doc_name +
                  " has been canceled Thank you."
              );
            }
          });
        });
    }

    function doc_leave(agent) {
      var doc_leave1 = agent.parameters.leave_date.split("T")[0];
      var doc_name0 = agent.parameters.doc_name0;
      var leave = admin.database().ref("Patients");
      var leave_id = leave.push().getKey();
      leave
        .child(leave_id)
        .child("Leave_date")
        .set(doc_leave1);
      leave
        .child(leave_id)
        .child("Doc_name")
        .set(doc_name0);
      leave
        .child(leave_id)
        .child("Age")
        .set("00000");
      leave
        .child(leave_id)
        .child("Name")
        .set("XXXX");
      leave
        .child(leave_id)
        .child("Patient_id")
        .set(leave_id);
      leave
        .child(leave_id)
        .child("Sex")
        .set("Male");
      leave
        .child(leave_id)
        .child("phno")
        .set("9999999");
      agent.add("Your leave has been applied, Thank you!");
    }

    function postponed_appointment(agent) {
      var result2 = admin.database();
      var inp_date1 = agent.parameters.date_postponed.split("T")[0];
      var inp_doc_name1 = agent.parameters.doc_name;
      var t1 = agent.parameters.new_time.split("T")[1];
      var t2 = t1.split("+");
      var new_inp_time = t2[0];
      var new_issue = agent.parameters.new_issue;
      var new_inp_date = agent.parameters.new_date.split("T")[0];

      return result2
        .ref("Patients")
        .once("value")
        .then(function(snapshot) {
          snapshot.forEach(function(childSnapshot) {
            var phone1 = childSnapshot.val().phno;
            var id2 = childSnapshot.val().Patient_Id;
            if (new_patient_phone === phone1) {
              edit(
                agent,
                id2,
                new_inp_time,
                new_inp_date,
                inp_date1,
                inp_doc_name1,
                new_issue
              );
              agent.add(
                "You have successfully changed your appointment date Thank you"
              );
            }
          });
        });
    }

    function edit(
      agent,
      id2,
      new_inp_time,
      new_inp_date,
      inp_date1,
      inp_doc_name1,
      new_issue
    ) {
      admin
        .database()
        .ref("Patients")
        .child(inp_date1)
        .child(inp_doc_name1)
        .child(id2)
        .remove();
      admin
        .database()
        .ref("Patients")
        .child(new_inp_date)
        .child(inp_doc_name1)
        .child(id2)
        .child("Patient_ID")
        .set(id2);
      admin
        .database()
        .ref("Patients")
        .child(new_inp_date)
        .child(inp_doc_name1)
        .child(id2)
        .child("Date")
        .set(new_inp_date);
      admin
        .database()
        .ref("Patients")
        .child(new_inp_date)
        .child(inp_doc_name1)
        .child(id2)
        .child("Time_of_appointment")
        .set(new_inp_time);
      admin
        .database()
        .ref("Patients")
        .child(new_inp_date)
        .child(inp_doc_name1)
        .child(id2)
        .child("Doc_Name")
        .set(inp_doc_name1);
      admin
        .database()
        .ref("Patients")
        .child(new_inp_date)
        .child(inp_doc_name1)
        .child(id2)
        .child("issue_of_the_patient")
        .set(new_issue);
    }

    function getUserDetails(agent) {
      agent.add("Please verify Your Details:");
      var count = 0;
      var new_patient_name = agent.parameters.New_patient_name;
      var new_patient_age = agent.parameters.New_patient_age;
      new_patient_phone = agent.parameters.New_patient_phone;
      var new_patient_gender = agent.parameters.New_patient_gender;
      var new_patient_email = agent.parameters.New_patient_email;
      agent.add(
        "Name: " +
          new_patient_name +
          "," +
          "Gender: " +
          new_patient_gender +
          "," +
          "Phone Number: " +
          new_patient_phone +
          "," +
          "Age: " +
          new_patient_age
      );
      agent.add(new Suggestion("Data is incorrect"));
      agent.add(new Suggestion("My details are correct"));
      var data1 = admin.database().ref("Patients");
      id = data1.push().getKey();
      temp_id = id;
      data1
        .child(id)
        .child("Name")
        .set(new_patient_name);
      data1
        .child(id)
        .child("Sex")
        .set(new_patient_gender);
      data1
        .child(id)
        .child("phno")
        .set(new_patient_phone);
      data1
        .child(id)
        .child("Age")
        .set(new_patient_age);
      data1
        .child(id)
        .child("Patient_Id")
        .set(id);
      data1
        .child(id)
        .child("Leave_date")
        .set("123213");
      data1
        .child(id)
        .child("Doc_name")
        .set("xxxx");
      data1
        .child("Email")
        .child(id)
        .child("Name")
        .set(new_patient_name);
      data1
        .child("Email")
        .child(id)
        .child("EmailId")
        .set(new_patient_email);
    }

    let intentMap = new Map();
    intentMap.set("welcome1", welcome);
    intentMap.set("Default Fallback Intent", fallback);
    intentMap.set("Register", getUserDetails);
    intentMap.set("booking_appointment", booking_appointment);
    intentMap.set("Cancel_Appointment", cancel_appointment);
    intentMap.set("Edit_Appointment_Date", postponed_appointment);
    intentMap.set("Register - custom", booking_appointment);
    intentMap.set("doc_leave", doc_leave);

    agent.handleRequest(intentMap);
  }
);
