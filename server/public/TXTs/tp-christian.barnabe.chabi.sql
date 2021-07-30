-- 1. Création des tables livres, abonnes et prets
CREATE TABLE livres {
    numInv INT(11) NOT NULL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    auteur VARCHAR(255) NOT NULL,
    qte INT(255) NOT NULL,
};

CREATE TABLE abonnes {
    numAb INT(11) NOT NULL PRIMARY KEY,
    nom VARCHAR(100),
    prenom VARCHAR(100) NOT NULL,
};

CREATE TABLE prets {
    livre_numInv INT(11) NOT NULL,
    abonne_numAb INT(11) NOT NULL,
    datePre DATETIME NOT NULL DEFAULT TIMESTAMP(),
    CONSTRAINT fk_abonnes_prets_numab
        FOREIGN KEY (abonne_numAb) 
        REFERENCES abonnes(numAb),
        ON DELETE CASCADE,
    CONSTRAINT fk_abonnes_prets_numinv
        FOREIGN KEY (livre_numInv) 
        REFERENCES livres(numInv) 
        ON DELETE CASCADE
};

-- I Rechercher toutes le données 
SELECT * FROM prets;
SELECT * FROM livres;
SELECT * FROM abonnes;

-- II Rechercher certaines lignes  
    -- II.a Tous les livres disponibles en quantité égale à 2
SELECT * FROM livres WHERE qte = 2;

    -- II.b Tous les livres disponibles en quantité comprise entre 6 et 2
SELECT * FROM livres WHERE qte BETWEEN 2 AND 6;

    -- II.c Tous les livres de titre Unix ou disponibles en quantité comprise  entre 6 et 2
SELECT * FROM livres WHERE titre = 'livre' OR qte BETWEEN 2 AND 6;

-- III Rechercher certaines colonnes
    -- III.a Le titre et la quantité de tous les livres
SELECT titre, qte FROM livres;

    -- III.b Le titre, la quantité et la quantité augmentée de 5 de tous les  livres
SELECT titre, qte, (qte+5) AS qte_aug FROM livres;

    -- III.c Les différentes quantité des livres
SELECT DISTINCT qte FROM livres;

    -- III.d Le titre et la quantité des livres disponibles en quantité supérieure  à 3
SELECT titre, qte FROM livres WHERE qte > 3;

-- IV Trier les lignes résultats
    -- IV.a Le titre et l’auteur des livres classés par titre
SELECT titre, auteur FROM livres ORDER BY titre;

    -- IV.b Ordre décroissant
SELECT titre, auteur FROM livres ORDER BY titre DESC;

    -- IV.c Uniquement les livre en quantité supérieure à 3  
SELECT titre, auteur FROM livres WHERE qte > 3;

-- V Calcul sur les dates ( !!! adapter à Access. Utiliser date())
-- 
-- 

-- VI Recherche sur motifs (Pattern Matching) 
    -- V.a Titre et auteurs des livres dont le titre commence par ‘L’
SELECT titre, auteur FROM livres WHERE titre LIKE 'L%';

    -- V.b Titre et auteurs des livres dont la 2e lettre du titre est un ‘a’
SELECT titre, auteur FROM livres WHERE titre LIKE '_a%';

    -- V.c Titre et auteurs des livres dont le titre a quatre lettres
SELECT titre, auteur FROM livres WHERE titre LIKE '____';

-- VII Calcul statistiques (Compter les lignes, moyennes de colonnes  etc...)  
    -- VII.a Quel est le nombre de livres
SELECT COUNT(*) FROM livres;

    -- VII.b Quel est le nombre de livre disponible en quantité égale à 2
SELECT COUNT(*) FROM livres WHERE qte = 2;

    -- VII.c Renommer la colonne résultat de count
SELECT COUNT(*) AS nombre_livres FROM livres;

    -- VII.d  Quel est, par livre, le nombre d’abonnés l’ayant emprunté
SELECT l.titre, COUNT(abonne_numAb) FROM livre AS l, prets AS p, abonnes AS a GROUP BY abonne_numAb;

    -- VII.e Quelle est le livre emprunté par plus de 3 abonnés
SELECT *, COUNT(DISTINCT(p.abonne_numAb)) AS customer_count FROM livres AS l JOIN prets AS p 
ON l.numInv = p.livre_numInv
GROUP BY p.abonne_numAb HAVING p.customer_count > 3;

    -- VII.f Quelle est la quantité maximum disponible pour un livre
-- SELECT 

    -- VII.g Quelle est le livre disponible en quantité maximum
SELECT *, MAX(qte) FROM livres;

-- VIII. Utiliser plusieurs tables (JOIN)
    -- VIII.a Quel est le numéro des livres emprunté par l’abonné 12
SELECT livre_numInv FROM prets WHERE abonne_numAb = 12;

    -- VIII.b Quel est le titre des livres emprunté par l’abonné 12
SELECT l.titre FROM prets as p JOIN livres AS l ON p.livre_numInv = l.numInv WHERE p.abonne_numAb = 12;

    -- VIII.c Forme générale d’une jointure 

    -- VIII.d Quels sont les numéros abonné avec le titre des livres empruntés
SELECT p.livre_numInv, l.titre, FROM prets as p JOIN livres AS l ON p.livre_numInv = l.numInv;

    -- VIII.f Quels sont les n° abonné et les titres des livres empruntés à la date ‘2007- 10-3’
SELECT p.livre_numInv, l.titre, FROM prets as p JOIN livres AS l ON p.livre_numInv = l.numInv WHERE p.datePre = '2007-10-03';

    -- VIII.h faites une Jointure des trois tables
SELECT * FROM livre AS l, prets AS p, abonnes AS a
ON p.livre_numInv = l.numInv, p.abonne_numAb = a.numAb;
    
    -- VIII.i Quel est le nom de l’abonné ayant emprunté un livre sur Unix
SELECT nom FROM abonnes WHERE numAb = (SELECT abonne_numAb FROM prets AS p INNER JOIN livres AS l ON p.livre_numInv = l.numInv WHERE l.titre = 'Unix');

    -- VIII.j Quelles sont les paires de livres disponibles en quantié égale
SELECT a.titre FROM livres as a, livres as b WHERE a.qte = b.qte;

-- IX. Usage de Exists
    -- IX.a Quel est le titre des livres faisant l’objet d’un prêt
SELECT titre FROM livres WHERE EXISTS (SELECT livre_numInv FROM prets WHERE livre_numInv = livres.numInv);

    -- IX.b Quel est le titre des livres ne faisant l’objet d’aucun prêt
SELECT titre FROM livres WHERE NOT EXISTS (SELECT livre_numInv FROM prets WHERE livre_numInv = livres.numInv);

    -- IV. c Quel est le numéro du livre emprunté par tous les abonnés
SELECT titre FROM livres WHERE NOT EXISTS (SELECT livre_numInv FROM prets WHERE livre_numInv = livres.numInv);

    -- IV.d Pour tous les livres afficher les informations le concernant
SELECT * FROM livre AS l, prets AS p, abonnes AS a
ON p.livre_numInv = l.numInv, p.abonne_numAb = a.numAb;

-- X. Commande de mise à jour
    -- a) Ajouter le livre <334, Weaving the Web, Tim Berners-Lee, 4> 
INSERT INTO livres VALUES(334, "Weaving the Web", "Tim Berners-Lee", 4);

    -- b) Ajouter l’abonné <18, Kacem>. (On ne connaît pas le nom)  
INSERT INTO (abonnes numAb, prenom) VALUES(18, "Kacem");

    -- c) Supprimer le livre 334  
DELETE FROM livres WHERE numInv = 334;

    -- d) Remplacer le nom de l’abonné 18 par Benkacem 
UPDATE abonnes SET nom = "Benkacem" WHERE numAb = 18;

    -- e) Augmenter de 2 la quantité du livre 334
UPDATE livre SET qte = qte+2 WHERE numInv = 334;
