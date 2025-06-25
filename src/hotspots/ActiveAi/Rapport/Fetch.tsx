const fetchRapport = async (slug: string) => {
    const response = await fetch(`${import.meta.env.VITE_ACTIVREQUEST_API_URL}/${slug}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    })
    const data = await response.json()
    return data.consigne
}

export default fetchRapport
/*

expected response:
{
  "files": [],
  "activity": {
    "lang": "fr",
    "slug": "intervention-sonia",
    "title": "Incident en cuisine",
    "provider": [
      "https://lcms-ipt.mobiletic.net",
      "https://ipt.mobiletic.net",
      "https://ipt.mobiletic.com",
      "https://lcms-ipt.mobiletic.dev"
    ],
    "template": "report",
    "isPrivate": true
  },
  "consigne": "Avez-vous correctement géré la situation pour éviter les dégâts et servir une bonne sauce ? Expliquez-moi comment vous avez fait. \nRéfléchissez à ce que vous allez dire, puis cliquez sur le bouton \"audio\" pour enregistrer votre réponse. ",
  "response": {
    "types": {
      "file": false,
      "text": true,
      "audio": true,
      "image": false
    },
    "stopText": "",
    "startText": "",
    "speechDuration": 120,
    "foregroundImage": {

    }
  },
  "decoration": {
    "exitText": "",
    "welcomeAudio": {

    },
    "backgroundImage": {

    }
  }
}






*/