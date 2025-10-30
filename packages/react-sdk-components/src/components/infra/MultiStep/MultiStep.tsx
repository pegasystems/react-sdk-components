import React, { type PropsWithChildren } from 'react';

import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import type { PConnProps } from '../../../types/PConnProps';

import './MultiStep.css';

interface MultiStepProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  itemKey: string;
  actionButtons: any[];
  onButtonPress: any;
  bIsVertical: boolean;
  arNavigationSteps: any;
}

export default function MultiStep(props: PropsWithChildren<MultiStepProps>) {
  // Get emitted components from map (so we can get any override that may exist)
  const AssignmentCard = getComponentFromMap('AssignmentCard');

  const { getPConnect, children, itemKey = '', actionButtons, onButtonPress } = props;
  const { bIsVertical, arNavigationSteps } = props;

  let currentStep = arNavigationSteps.find(({ visited_status: vs }) => vs === 'current');
  if (!currentStep) {
    const lastActiveStepIndex = arNavigationSteps.findLastIndex(({ visited_status: vs }) => vs === 'success');
    currentStep = arNavigationSteps[lastActiveStepIndex >= 0 ? lastActiveStepIndex : 0];
  }

  function _getVBodyClass(index: number): string {
    const baseClass = 'psdk-vertical-step-body';
    const isNotLastStep = index < arNavigationSteps.length - 1;

    return isNotLastStep ? `${baseClass} psdk-vertical-step-line` : baseClass;
  }

  function _getAutoFlexClass(currentStep): string {
    const currentStepIndex = arNavigationSteps.findIndex(step => step.ID === currentStep?.ID);
    const totalSteps = arNavigationSteps.length;
    const lastStep = arNavigationSteps[totalSteps - 1];

    // Apply flex-auto class if current step is active OR if current step is second-to-last and the last step is active
    const isCurrentStepActive = currentStep.visited_status === 'current';
    const isSecondToLastWithActiveLastStep = currentStepIndex === totalSteps - 2 && lastStep?.visited_status === 'current';

    return isCurrentStepActive || isSecondToLastWithActiveLastStep ? 'flex-auto' : '';
  }

  function isLastStep(index: number): boolean {
    return index === arNavigationSteps.length - 1;
  }

  function buttonPress(sAction: string, sButtonType: string) {
    onButtonPress(sAction, sButtonType);
  }

  return (
    <div>
      {bIsVertical ? (
        <div className='psdk-vertical-stepper'>
          {arNavigationSteps.map((mainStep, index) => {
            return (
              <React.Fragment key={mainStep.actionID}>
                <div className='psdk-vertical-step'>
                  <div className={`psdk-vertical-step-header ${mainStep.visited_status}`}>
                    <div className={`psdk-vertical-step-icon`}>
                      <div className='psdk-vertical-step-icon-content'>
                        <span>{index + 1}</span>
                      </div>
                    </div>
                    <div className='psdk-vertical-step-label'>{mainStep.visited_status === 'current' && mainStep.name}</div>
                  </div>
                  <div className={_getVBodyClass(index)}>
                    {mainStep?.steps && (
                      <ul
                        style={{
                          paddingInlineStart: '0rem',
                          marginLeft: '-7px'
                        }}
                      >
                        {mainStep.steps.forEach(subStep => {
                          <li className='psdk-sub-step-list'>
                            <div style={{ display: 'inline-flex' }}>
                              {subStep.visited_status === 'current' && <img className='psdk-current-svg-icon' src='{svgCurrent}' />}
                              {subStep.visited_status !== 'current' && <img className='psdk-not-current-svg-icon' src='{svgNotCurrent}' />}
                              {subStep.visited_status === 'current' && <label className='psdk-sub-step-current'>{subStep.name}</label>}
                              {subStep.visited_status !== 'current' && <label className='psdk-sub-step-not-current'>{subStep.name}</label>}
                            </div>
                            {subStep.visited_status === 'current' && (
                              <div>
                                <AssignmentCard getPConnect={getPConnect} itemKey={itemKey} actionButtons={actionButtons} onButtonPress={buttonPress}>
                                  {children}
                                </AssignmentCard>
                              </div>
                            )}
                          </li>;
                        })}
                      </ul>
                    )}
                    {!mainStep?.steps && mainStep.visited_status === 'current' && (
                      <div style={{ paddingLeft: 20 }}>
                        <AssignmentCard getPConnect={getPConnect} itemKey={itemKey} actionButtons={actionButtons} onButtonPress={buttonPress}>
                          {children}
                        </AssignmentCard>
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      ) : (
        <div className='psdk-horizontal-stepper'>
          <div className='psdk-horizontal-stepper-header-container'>
            {arNavigationSteps.map((mainStep, index) => {
              return (
                <React.Fragment key={mainStep.actionID}>
                  <div className={`psdk-horizontal-step-header ${mainStep.visited_status}`}>
                    <div className='psdk-horizontal-step-icon'>
                      <div className='psdk-horizontal-step-icon-content'>
                        <span>{index + 1}</span>
                      </div>
                    </div>
                    <div className='psdk-horizontal-step-label'>{mainStep.visited_status === 'current' && mainStep.name}</div>
                  </div>
                  {!isLastStep(index) && <div className={`psdk-horizontal-step-line ${_getAutoFlexClass(mainStep)}`} />}
                </React.Fragment>
              );
            })}
          </div>
          {arNavigationSteps.map(mainStep => {
            return (
              <React.Fragment key={mainStep.actionID}>
                {mainStep.steps && (
                  <ul style={{ paddingInlineStart: '0rem', marginLeft: '35px' }}>
                    {mainStep.steps.map(subStep => (
                      <li className='psdk-sub-step-list'>
                        <div style={{ display: 'inline-flex' }}>
                          {subStep.visited_status === 'current' && <img className='psdk-current-svg-icon' src='{svgCurrent}' />}
                          {subStep.visited_status !== 'current' && <img className='psdk-not-current-svg-icon' src='{svgNotCurrent}' />}
                          {subStep.visited_status === 'current' && <label className='psdk-sub-step-current'>{subStep.name}</label>}
                          {subStep.visited_status !== 'current' && <label className='psdk-sub-step-not-current'>{subStep.name}</label>}
                        </div>
                        {subStep.visited_status === 'current' && (
                          <AssignmentCard getPConnect={getPConnect} itemKey={itemKey} actionButtons={actionButtons} onButtonPress={buttonPress}>
                            {children}
                          </AssignmentCard>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {!mainStep?.steps && mainStep.ID === currentStep?.ID && (
                  <AssignmentCard getPConnect={getPConnect} itemKey={itemKey} actionButtons={actionButtons} onButtonPress={buttonPress}>
                    {children}
                  </AssignmentCard>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
