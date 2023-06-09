const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const db = require("better-sqlite3")("eksamen.db");
const hbs = require("hbs");
const path = require("path");

const app = express();

//forbereder session
app.use(session({
    secret: "ZGV0dGVoZXJlcnNqdWx0",
    resave: false,
    saveUninitialized: false 
}));

app.use(express.static(path.join(__dirname, "Public")));
app.use(express.urlencoded({extended: true}))
app.set("view engine", hbs);
app.set("views", path.join(__dirname, "./views/pages"))
hbs.registerPartials(path.join(__dirname, "./Views/Partials"))

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/index.html"))
})

app.post("/LoggIn", async (req, res) => {
    let svar = req.body;
    let data = db.prepare("SELECT * FROM Person WHERE Person.Epost = ?").get(svar.Epost);
    if(data){//sjekker at bruker finnes
        if(await bcrypt.compare(svar.password, data.PassordHash)){//samenligner passord med databasen
            let userData= data;

            //lagre brukerdata i sessionen
            req.session.loggedin = true;
            req.session.userData = userData;
            req.session.admin = false;
            req.session.klasseData = db.prepare("SELECT * FROM Klasse WHERE Klasse.id = ?").get(userData.Klasse_id);

            if(userData.rolle == "Admin"){
                req.session.admin = true;
            }
            res.redirect("/Profil");
        }else{         
            res.send('<script>alert("Feil Epost eller Passord"); location.href = "/loggIn.html"; </script>');
        }
    }else{
        res.send('<script>alert("Feil Epost eller Passord"); location.href = "/loggIn.html"; </script>');

    }
});
app.get("/Profil", (req, res)=>{
    if(req.session.loggedin){

        res.render("Profil.hbs", {
            userdata: req.session.userData,
            klasseData: req.session.klasseData,
            Admin: req.session.admin
        })
    }else{
        res.redirect("/index.html");
    }
});

app.get("/brukere", (req, res)=>{
    let brukere = db.prepare("SELECT * FROM Person").all()
    let objekt = {brukere: brukere}
    res.render("brukere.hbs", objekt)
});

app.post("/slettBruker", (req, res) => {
    let id = req.body.id;
    slettBruker(id);
    res.redirect("back");
});

function slettBruker(id) {
    let slettBruker = db.prepare("DELETE FROM Person WHERE id = ?");
    slettBruker.run(id);
}

app.post("/endreBruker", (req, res) => {
    let svar = req.body
    endreBruker(svar.id,
                svar.Fornavn,
                svar.Etternavn,
                svar.Epost,
                svar.Klasse_id,
                svar.Brukernavn,
                svar.tlf,
                svar.rolle)
    res.redirect("back");
});

function endreBruker(id, rolle, Fornavn, Etternavn, tlf, Brukernavn, Epost, Klasse_id) {
    let brukere = db.prepare("UPDATE Person SET rolle = ?, Fornavn = ?, Etternavn = ?, tlf = ?, Brukernavn = ?, Epost = ?, Klasse_id = ? WHERE id = ?");
    brukere.run(rolle, Fornavn, Etternavn, tlf, Brukernavn, Epost, Klasse_id, id);
  }
  

app.get("/ukeplan", (req, res)=>{
    if(req.session.loggedin){

        res.render("ukeplan.hbs", {
            userdata: req.session.userData,
            klasseData: req.session.klasseData,
            Admin: req.session.admin
        })
    }else{
        res.redirect("/index.html");
    }
});

app.get("/CreateUserForm", (req, res)=>{
    if(req.session.loggedin && req.session.admin){
        trinn= db.prepare("SELECT * FROM Klasse").all();
        res.render("CreateUserForm.hbs",{
            Admin: req.session.admin,
            trinn: trinn
        })
    }else{
        res.redirect("/index.html");
    }
});

app.post("/CreateUser", async (req, res) => {
    let svar = req.body;
    // Get the first three letters of the first and last name
    let Brukernavn = (svar.Fornavn.slice(0, 3) + svar.Etternavn.slice(0, 3)).toLowerCase();
    // Get the first three letters of the first and last name for email prefix
    let emailPrefix = (svar.Fornavn.slice(0, 3) + svar.Etternavn.slice(0, 3)).toLowerCase();
    // Generate the email by combining the email prefix and a domain
    let Epost = emailPrefix + "@skolen.com";
      
      if (svar.rolle == "Elev") {
        if (svar.Klasse_id != "Ingen") {
          let hash = await bcrypt.hash(svar.PassordHash, 10);
          db.prepare(`
            INSERT INTO Person (rolle, Fornavn, Etternavn, Epost, tlf, Brukernavn, Klasse_id, PassordHash) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
          `).run(svar.rolle, svar.Fornavn, svar.Etternavn, Epost, svar.tlf, Brukernavn, svar.Klasse_id, hash);
          
        } else {
          res.send('<script>alert("Elever må være i en klasse"); location.href = "/CreateUserForm"; </script>');
        }
      } else {
        let hash = await bcrypt.hash(svar.PassordHash, 10);
        db.prepare(`
            INSERT INTO Person (rolle, Fornavn, Etternavn, Epost, tlf, Brukernavn, Klasse_id, PassordHash) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
          `).run(svar.rolle, svar.Fornavn, svar.Etternavn, Epost, svar.tlf, Brukernavn, svar.Klasse_id, hash);
      }
      res.send('<script>alert("Bruker lagt til"); location.href = "/CreateUserForm"; </script>');
  });

app.get("/Loggout", (req, res) => {
    //fjern sessionen
    req.session.destroy();
    res.redirect("/");
})

/*
app.get("/changePwd", (req, res)=>{
    if(req.session.loggedin){

        res.render("UpdatePwd.hbs", {
            Admin: req.session.admin
        })
    }else{
        res.redirect("/index.html");
    }
})

app.post("/updpwd", async (req,res)=>{
    let svar = req.body;
    if(await bcrypt.compare(svar.oldpassword, req.session.userData.PassordHash)){
        let hash = await bcrypt.hash(svar.newpassword, 10)
        db.prepare("UPDATE Person SET PassordHash = ? WHERE id = ?").run(hash, req.session.userData.id)
        res.send('<script>alert("Passord oppdatert"); location.href = "/profil"; </script>');
    }
});
*/

//timeplan hvor den rendrer siden og henter dager og tider fra databasen
app.get("/TimePlan", (req,res)=>{
    if(req.session.loggedin){
        if(req.session.userData.Rolle == "Elev"){
            
            res.render("TimePlan.hbs",
            {
                Mandag:{
                    t1:db.prepare("SELECT Navn FROM Time WHERE Klasse_id=? AND Dag='Mandag' AND Time='1'").get(req.session.userData.Klasse_id),
                    t2:db.prepare("SELECT Navn FROM Time WHERE Klasse_id=? AND Dag='Mandag' AND Time='2'").get(req.session.userData.Klasse_id),
                    t3:db.prepare("SELECT Navn FROM Time WHERE Klasse_id=? AND Dag='Mandag' AND Time='3'").get(req.session.userData.Klasse_id),
                    t4:db.prepare("SELECT Navn FROM Time WHERE Klasse_id=? AND Dag='Mandag' AND Time='4'").get(req.session.userData.Klasse_id),
                    t5:db.prepare("SELECT Navn FROM Time WHERE Klasse_id=? AND Dag='Mandag' AND Time='5'").get(req.session.userData.Klasse_id),
                    t6:db.prepare("SELECT Navn FROM Time WHERE Klasse_id=? AND Dag='Mandag' AND Time='6'").get(req.session.userData.Klasse_id)
                },
                Tirsdag:{
                    t1:db.prepare("SELECT Navn FROM Time WHERE Klasse_id=? AND Dag='Tirsdag' AND Time='1'").get(req.session.userData.Klasse_id),
                    t2:db.prepare("SELECT Navn FROM Time WHERE Klasse_id=? AND Dag='Tirsdag' AND Time='2'").get(req.session.userData.Klasse_id),
                    t3:db.prepare("SELECT Navn FROM Time WHERE Klasse_id=? AND Dag='Tirsdag' AND Time='3'").get(req.session.userData.Klasse_id),
                    t4:db.prepare("SELECT Navn FROM Time WHERE Klasse_id=? AND Dag='Tirsdag' AND Time='4'").get(req.session.userData.Klasse_id),
                    t5:db.prepare("SELECT Navn FROM Time WHERE Klasse_id=? AND Dag='Tirsdag' AND Time='5'").get(req.session.userData.Klasse_id),
                    t6:db.prepare("SELECT Navn FROM Time WHERE Klasse_id=? AND Dag='Tirsdag' AND Time='6'").get(req.session.userData.Klasse_id)
                },
                Onsdag:{
                    t1:db.prepare("SELECT Navn FROM Time WHERE Klasse_id=? AND Dag='Onsdag' AND Time='1'").get(req.session.userData.Klasse_id),
                    t2:db.prepare("SELECT Navn FROM Time WHERE Klasse_id=? AND Dag='Onsdag' AND Time='2'").get(req.session.userData.Klasse_id),
                    t3:db.prepare("SELECT Navn FROM Time WHERE Klasse_id=? AND Dag='Onsdag' AND Time='3'").get(req.session.userData.Klasse_id),
                    t4:db.prepare("SELECT Navn FROM Time WHERE Klasse_id=? AND Dag='Onsdag' AND Time='4'").get(req.session.userData.Klasse_id),
                    t5:db.prepare("SELECT Navn FROM Time WHERE Klasse_id=? AND Dag='Onsdag' AND Time='5'").get(req.session.userData.Klasse_id),
                    t6:db.prepare("SELECT Navn FROM Time WHERE Klasse_id=? AND Dag='Onsdag' AND Time='6'").get(req.session.userData.Klasse_id)
                },
                Torsdag:{
                    t1:db.prepare("SELECT Navn FROM Time WHERE Klasse_id=? AND Dag='Torsdag' AND Time='1'").get(req.session.userData.Klasse_id),
                    t2:db.prepare("SELECT Navn FROM Time WHERE Klasse_id=? AND Dag='Torsdag' AND Time='2'").get(req.session.userData.Klasse_id),
                    t3:db.prepare("SELECT Navn FROM Time WHERE Klasse_id=? AND Dag='Torsdag' AND Time='3'").get(req.session.userData.Klasse_id),
                    t4:db.prepare("SELECT Navn FROM Time WHERE Klasse_id=? AND Dag='Torsdag' AND Time='4'").get(req.session.userData.Klasse_id),
                    t5:db.prepare("SELECT Navn FROM Time WHERE Klasse_id=? AND Dag='Torsdag' AND Time='5'").get(req.session.userData.Klasse_id),
                    t6:db.prepare("SELECT Navn FROM Time WHERE Klasse_id=? AND Dag='Torsdag' AND Time='6'").get(req.session.userData.Klasse_id)
                },
                Fredag:{
                    t1:db.prepare("SELECT Navn FROM Time WHERE Klasse_id=? AND Dag='Fredag' AND Time='1'").get(req.session.userData.Klasse_id),
                    t2:db.prepare("SELECT Navn FROM Time WHERE Klasse_id=? AND Dag='Fredag' AND Time='2'").get(req.session.userData.Klasse_id),
                    t3:db.prepare("SELECT Navn FROM Time WHERE Klasse_id=? AND Dag='Fredag' AND Time='3'").get(req.session.userData.Klasse_id),
                    t4:db.prepare("SELECT Navn FROM Time WHERE Klasse_id=? AND Dag='Fredag' AND Time='4'").get(req.session.userData.Klasse_id),
                    t5:db.prepare("SELECT Navn FROM Time WHERE Klasse_id=? AND Dag='Fredag' AND Time='5'").get(req.session.userData.Klasse_id),
                    t6:db.prepare("SELECT Navn FROM Time WHERE Klasse_id=? AND Dag='Fredag' AND Time='6'").get(req.session.userData.Klasse_id)
                },
                Admin: req.session.Admin
            })
        }else if(req.session.userData.TillgangNiva>1){
            Klasser=db.prepare("SELECT * FROM Klasse").all();
            res.render("AddTime.hbs",{
                klasser: Klasser
            })
        }
    }else{
        res.redirect("/index.html");
    }
})

//en app.post som lar deg legge til dag og tid i ukeplanen
app.post("/AddTime", (req,res)=>{
    svar=req.body;
    db.prepare("DELETE FROM Time WHERE Klasse_id=? AND Dag=? AND Time=?;").run(svar.klasse, svar.dag, svar.time);
    db.prepare("INSERT INTO Time (Navn,Klasse_id,Dag,Time)VALUES (?,?,?,?);").run(svar.aktivitet, svar.klasse, svar.dag, svar.time); 
    res.send('<script>alert("TimeLagtIn"); location.href = "/TimePlan"; </script>');
})

app.listen(3000,()=>{
    console.log("Running")
})