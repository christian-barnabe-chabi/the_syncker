/*
  Pr Moussa DIALLO
  http://edmi.ucad.sn/~moussadiallo/index.php
  ce programme permet de transmettre via le port série un message à la carte.
  A la réception du message, la carte répond en envoyant: message bien reçu 
  suivi du message reçu.

*/


const int lamp_pin = 12;
void setup() { 
  pinMode(lamp_pin, OUTPUT);
  digitalWrite(lamp_pin, LOW);
  Serial.begin(9600);   // ouverture du port série avec un débit de 9600 Bauds  
}

void loop() {
  
 if (Serial.available()>0) // s'il y a des caractères sur le port série
                             
  {
    String message= Serial.readString(); //lire le message en entier
    if(message=="on") {
      digitalWrite(lamp_pin, HIGH);
      Serial.println(message);
    }
    if(message=="off") {
      digitalWrite(lamp_pin, LOW);
      Serial.println(message);
    }
    Serial.print("Message recu: ");//affichage sans aller à la ligne
    Serial.println(message.equals(String("on")));//affichage avec saut de ligne
    Serial.println(message=="on");
  }
}
