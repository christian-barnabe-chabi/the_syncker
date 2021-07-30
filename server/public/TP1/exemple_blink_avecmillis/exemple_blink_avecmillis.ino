/*
  Pr Moussa DIALLO
  http://edmi.ucad.sn/~moussadiallo/index.php
  ce programme permet d'allumer et d'eteindre une led à un rithme
   d'une seconde avec utilisation de la fonction millis()
*/

const int lampe_pin=12;
float temps;
int etat=0;
void setup() { 
   pinMode(lampe_pin, OUTPUT); //initialises de lampe_pin comme sortie 
   temps=millis(); //lancement du chronométre 
}

void loop() {
     //Si (une seconde et lampe eteinte)
     if(millis()-temps>1000 && etat==0)
     {
     digitalWrite(lampe_pin, HIGH);   // Allumes la led
     temps=millis();//lancement du chronométre 
     etat=1; //la lampe est à l'état allumer
     }

     //Si (une seconde et lampe alluler)
     if(millis()-temps>1000 && etat==1) 
     {
     digitalWrite(lampe_pin, LOW);   // Eteins la led
     temps=millis();    // lancement du chronométre 
     etat=0;    //la lampe est à l'état eteint
     }
    
 
}
