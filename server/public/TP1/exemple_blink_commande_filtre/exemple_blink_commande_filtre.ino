/*
  Pr Moussa DIALLO
  http://edmi.ucad.sn/~moussadiallo/index.php
  ce programme permet de transmettre via le port série un message à la carte.
  A la réception du message, la carte répond en envoyant: message bien reçu 
  suivi du message reçu.

*/
int lampe_pin=5;

void setup() { 
 pinMode(lampe_pin, OUTPUT); //initialises de lampe_pin comme sortie  
 digitalWrite(lampe_pin, LOW);//initialiser l'état de la lampe à éteint 
 Serial.begin(9600); //ouverture du port série avec un débit de 9600
}

void loop() {
  
 if (Serial.available()>0) // s'il y a des caractères sur le port série
                             
  {
    String message= Serial.readString(); //lire le message en entier
    Serial.println(message);
    if(message=="on\n" ){
       digitalWrite(lampe_pin, HIGH);   
    }else if(message=="off\n"){
      digitalWrite(lampe_pin, LOW);
    }else{
       Serial.println("saisie incorrecte");   
    }

  }
}
