interface FileData {
  name: string;
  type: string;
  url: string;
}

interface ResponseData {
  text: string;
  files: FileData[];
}

interface PostAnswerRequest {
  response: ResponseData;
  timestamp: string;
}

interface Evaluation {
  id: string;
  title: string;
  feedback: string;
  score: number;
  score_min: number;
  score_max: number;
}

interface PostAnswerResponse {
  evaluations: Evaluation[];
  score?: number;
  cost?: number;
  usage?: {
    prompt_tokens: number;
    candidates_token_count: number;
    cost: number;
  };
  learning_objects?: any;
  average_score?: number;
  appreciation_globale?: string;
}

const postAnswer = async (slug: string, answer: string, file_url?: string): Promise<PostAnswerResponse> => {
  const files: FileData[] = [];
  
  if (file_url) {
    files.push({
      name: file_url.split('/').pop() || 'audio.wav',
      type: 'audio/wav',
      url: file_url
    });
  }

  const requestData: PostAnswerRequest = {
    response: {
      text: answer,
      files: files
    },
    timestamp: new Date().toISOString()
  };

  const response = await fetch(`${import.meta.env.VITE_ACTIVREQUEST_API_URL}/${slug}/_response`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestData)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  const data: PostAnswerResponse = await response.json();
  return data;
};

export default postAnswer;

/*
Expected sending request:
POST activity_response
api/activity/{slug: ex. chez-ronchont}/_response
json
JSON
{"response": {"text": "Votre texte ici...","files": [{"name": "articles-partitifs.pdf","type": "application/pdf","url": "/ns/get/8d3d8df2-9ec5-4d5f-bbfb-1a9897d1b9e5.pdf"}]},"timestamp": ""}

Expected response:
{
  "evaluations": [
    {
      "id": "informer_et_expliquer",
      "title": "Informer et expliquer",
      "feedback": "Vous avez bien fait d'éteindre la gazinière et de déplacer la sauce. C'était important pour éviter d'autres dégâts. Vous avez aussi eu raison de faire appel au chef. C'est bien de demander de l'aide quand on en a besoin. Expliquez clairement ce qui s'est passé au chef pour qu'il puisse vous aider au mieux.",
      "score": 100,
      "score_min": 0,
      "score_max": 100
    },
    {
      "id": "proposer_une_solution",
      "title": "Proposer une solution",
      "feedback": "Vous avez bien réagi en retirant la casserole et en transvasant la sauce. C'est une bonne façon de limiter les dégâts. Pour la prochaine fois, essayez de réfléchir à une solution pour sauver la sauce, comme par exemple enlever la partie brûlée et ajouter un peu de crème fraîche. Cela montre que vous pouvez réagir de manière autonome face à un problème.",
      "score": 100,
      "score_min": 0,
      "score_max": 100
    }
  ],
  "score": 100,
  "cost": 0.00015910000000000002,
  "usage": {
    "prompt_tokens": 559,
    "candidates_token_count": 258,
    "cost": 0.00015910000000000002
  },
  "learning_objects": {
    "activity": {
      "slug": "intervention-sonia",
      "title": "Incident en cuisine",
      "type": "ai_activity",
      "model": "report"
    },
    "interactions": [
      {
        "id": "activity::intervention-sonia",
        "type": "performance",
        "objectives": [
          {
            "id": "Informer et expliquer"
          },
          {
            "id": "Proposer une solution"
          }
        ],
        "learner_response": "Text: Oui j'ai éteint la gazinière, puis j'ai enlevé la casserole et a déversé la sauce dans un autre récipient et j'ai fait appel au chef pour m'aider à résoudre la situation \n"
      }
    ],
    "objectives": [
      {
        "id": "Informer et expliquer",
        "description": "Vous avez bien fait d'éteindre la gazinière et de déplacer la sauce. C'était important pour éviter d'autres dégâts. Vous avez aussi eu raison de faire appel au chef. C'est bien de demander de l'aide quand on en a besoin. Expliquez clairement ce qui s'est passé au chef pour qu'il puisse vous aider au mieux.",
        "score": {
          "min": 0,
          "max": 100,
          "raw": 100,
          "scaled": 1.0
        },
        "status": "completed",
        "progress_measure": 1
      },
      {
        "id": "Proposer une solution",
        "description": "Vous avez bien réagi en retirant la casserole et en transvasant la sauce. C'est une bonne façon de limiter les dégâts. Pour la prochaine fois, essayez de réfléchir à une solution pour sauver la sauce, comme par exemple enlever la partie brûlée et ajouter un peu de crème fraîche. Cela montre que vous pouvez réagir de manière autonome face à un problème.",
        "score": {
          "min": 0,
          "max": 100,
          "raw": 100,
          "scaled": 1.0
        },
        "status": "completed",
        "progress_measure": 1
      }
    ],
    "score": {
      "min": 0,
      "max": 100,
      "raw": 100,
      "scaled": 1.0
    },
    "comments_from_lms": [
      {
        "comment": ""
      }
    ],
    "status": "completed",
    "progress_measure": 1
  },
  "average_score": 100
}
*/