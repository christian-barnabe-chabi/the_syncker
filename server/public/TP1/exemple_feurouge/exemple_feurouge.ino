/*
  Pr Moussa DIALLO
  http://edmi.ucad.sn/~moussadiallo/index.php
  ce programme permet de gerer un feu de circulation
*/

const int lampe_Verte=12;
const int lampe_Rouge=11;
const int lampe_Orange=10;

void setup() { 
   pinMode(lampe_Verte, OUTPUT); //initialises de lampe_Verte comme sortie
   pinMode(lampe_Rouge, OUTPUT); //initialises de lampe_Rouge comme sortie
   pinMode(lampe_Orange, OUTPUT); //initialises de lampe_Orange comme sortie
   
     
}

void loop() {
  digitalWrite(lampe_Verte, HIGH);   // Allumes la verte
  digitalWrite(lampe_Orange, LOW);
  digitalWrite(lampe_Rouge, LOW);
  delay(70000);                       
  digitalWrite(lampe_Verte, LOW);   
  digitalWrite(lampe_Orange, HIGH);  // Allumes le Orange
  digitalWrite(lampe_Rouge, LOW);
  delay(5000);
  digitalWrite(lampe_Verte, LOW);   
  digitalWrite(lampe_Orange, LOW);  
  digitalWrite(lampe_Rouge, HIGH);   // Allumes le Rouge
  delay(50000);
}
