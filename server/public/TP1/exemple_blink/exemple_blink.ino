/*
  Pr Moussa DIALLO
  http://edmi.ucad.sn/~moussadiallo/index.php
  ce programme permet d'allumer et d'eteindre une led à un rithme 1seconde
*/

const int lampe_pin=12;

void setup() { 
   pinMode(lampe_pin, OUTPUT); //initialises de lampe_pin comme sortie  
}

void loop() {
  digitalWrite(lampe_pin, HIGH);   // Allumes la led
  delay(1000);                       // patientes une seconde
  digitalWrite(lampe_pin, LOW);    // Eteins la led
  delay(1000); // patientes une seconde
}
