# Plant Disease Prediction System

A Deep Learning-based system for detecting plant diseases from images, featuring a FastAPI backend and a MobileNetV3 model.

## Prerequisites

- Python 3.9 or higher
- `pip` package manager
- Virtual environment tool (`venv` or `virtualenv`)

## Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd leafdoc-backend
    ```

2.  **Create and activate a virtual environment:**

    ```bash
    python -m venv .venv
    source .venv/bin/activate  # On Windows: .venv\Scripts\activate
    ```

3.  **Install dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

4.  **Environment Configuration:**
    Ensure a `.env` file exists in the root directory with the following content:
    ```env
    MODEL_PATH=models/plant_disease_model.keras
    ALLOWED_ORIGINS=*
    DEBUG=True
    ```

## Dataset

The project expects the Kaggle "New Plant Diseases Dataset" to be located at `kaggle-model/New Plant Diseases Dataset(Augmented)/New Plant Diseases Dataset(Augmented)`.
Ensure the directory structure contains `train` and `valid` folders with class subdirectories.

## Training the Model

To train the MobileNetV3 model on your dataset:

1.  Ensure the virtual environment is active.
2.  Run the training script:
    ```bash
    python train_model.py
    ```
    This will:
    - Augment and preprocess the data.
    - Train the model for the specified number of epochs.
    - Save the best model to `models/plant_disease_model.keras`.
    - Save class indices to `models/class_indices.json`.

## Running the API

To start the FastAPI server:

```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.

## API Usage

- **Documentation:** Visit `http://localhost:8000/docs` for the interactive Swagger UI.
- **Prediction Endpoint:** `POST /predict`
  - **Input:** Image file (binary).
  - **Response:** JSON containing the predicted disease, confidence score, top 3 probabilities, and prevention/action recommendations.

## Testing

Run unit tests using pytest:

```bash
pytest tests/
```
