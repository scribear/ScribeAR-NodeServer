'''
Type definitions for messages used for negotiating model selection

Types:
    ModelOption
    SelectionOptions
    FeatureSelection
    ModelSelection
'''
from typing import TypedDict
from custom_types.config_types import AvailableFeaturesConfig


class ModelOption(TypedDict):
    '''
    Type hint for a model option available to frontend
    Nested within SelectionOptions
    '''
    model_key: str
    display_name: str
    description: str
    available_features: AvailableFeaturesConfig


# Type hint for available models that is presented to the frontend
type SelectionOptions = list[ModelOption]


class FeatureSelection(TypedDict):
    '''
    Type hint for user's choice for what features to use
    Nested within ModelSelection
    '''


class SelectedOption(TypedDict):
    '''
    Type hint for message frontend sends to select a model
    '''
    model_key: str
    feature_selection: FeatureSelection
