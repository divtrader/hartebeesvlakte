import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Logo } from '../components/Logo';
import { PersonAvatar } from '../components/PersonAvatar';
import { setSetting, useSetting } from '../db';
import { FARM } from '../data/farm';
import { getPosition } from '../lib/gps';
import { install, isInstalled, isIPhone, useCanInstall } from '../lib/install';
import { WhoPicker } from './Today';

type Step = 'welcome' | 'who' | 'location' | 'install' | 'done';

function Dots({ step, steps }: { step: Step; steps: Step[] }) {
  return (
    <div className="setup__dots" aria-hidden="true">
      {steps.map((s) => (
        <span key={s} data-on={s === step} />
      ))}
    </div>
  );
}

/** iPhone keeps a home screen app's records apart from Safari, so on iPhone the app is added first. */
function HomeScreenFirst({ onSkip }: { onSkip: () => void }) {
  return (
    <div className="setup">
      <div className="setup__body">
        <Logo size={88} />
        <h1>First, put {FARM.name} Veldboek on your home screen</h1>
        <ol className="setup__steps">
          <li>
            <span className="setup__num">1</span>
            <span>
              Tap <b>Share</b> <Icon name="share" size={18} /> at the bottom of Safari.
            </span>
          </li>
          <li>
            <span className="setup__num">2</span>
            <span>
              Scroll down and tap <b>Add to Home Screen</b>, then <b>Add</b>.
            </span>
          </li>
          <li>
            <span className="setup__num">3</span>
            <span>
              Tap the new <b>Veldboek</b> icon on your home screen. Setup carries on there.
            </span>
          </li>
        </ol>
      </div>
      <div className="setup__foot">
        <button type="button" className="btn btn--ghost" onClick={onSkip}>
          Carry on in Safari instead
        </button>
      </div>
    </div>
  );
}

/** First start: who are you, location, home screen. A minute, then straight into the app. */
export function Setup() {
  const recorder = useSetting<string>('recorder', '');
  const canInstall = useCanInstall();
  const [step, setStep] = useState<Step>('welcome');
  const [inSafari, setInSafari] = useState(() => isIPhone() && !isInstalled());
  const [asking, setAsking] = useState(false);

  if (inSafari) return <HomeScreenFirst onSkip={() => setInSafari(false)} />;

  const steps: Step[] = ['welcome', 'who', 'location', ...(isInstalled() || isIPhone() ? [] : (['install'] as Step[])), 'done'];
  const next = () => setStep(steps[Math.min(steps.indexOf(step) + 1, steps.length - 1)]);

  async function allowLocation() {
    setAsking(true);
    try {
      await getPosition(15_000);
    } catch {
      // Declined or no fix; the app still works, records just have no position.
    }
    setAsking(false);
    next();
  }

  return (
    <div className="setup">
      <Dots step={step} steps={steps} />

      {step === 'welcome' && (
        <>
          <div className="setup__body">
            <Logo size={96} />
            <h1>
              Welkom!
              <br />
              Welcome to {FARM.name} Veldboek
            </h1>
            <p>Let's get your phone ready. It takes less than a minute.</p>
          </div>
          <div className="setup__foot">
            <button type="button" className="btn btn--primary setup__go" onClick={next}>
              Let's go
            </button>
          </div>
        </>
      )}

      {step === 'who' && (
        <div className="setup__body setup__body--top">
          <h1>Who are you?</h1>
          <p>Tap your face.</p>
          <WhoPicker
            current={recorder}
            onPick={(name) => {
              void setSetting('recorder', name);
              setTimeout(next, 350);
            }}
          />
        </div>
      )}

      {step === 'location' && (
        <>
          <div className="setup__body">
            <span className="setup__icon">
              <Icon name="pin" size={44} />
            </span>
            <h1>Allow your location</h1>
            <p>Veldboek notes where on the farm you see each animal, bird and plant. Your phone will ask; tap Allow.</p>
          </div>
          <div className="setup__foot">
            <button type="button" className="btn btn--primary setup__go" onClick={allowLocation} disabled={asking}>
              {asking ? 'Waiting for your phone' : 'Allow location'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={next}>
              Not now
            </button>
          </div>
        </>
      )}

      {step === 'install' && (
        <>
          <div className="setup__body">
            <span className="setup__icon">
              <Icon name="download" size={44} />
            </span>
            <h1>Put the app on your home screen</h1>
            {canInstall ? (
              <p>Then it opens like a normal app, even without signal.</p>
            ) : (
              <p>
                In Chrome, tap the <b>⋮</b> menu at the top right, then <b>Install app</b> or <b>Add to Home screen</b>.
              </p>
            )}
          </div>
          <div className="setup__foot">
            {canInstall ? (
              <button
                type="button"
                className="btn btn--primary setup__go"
                onClick={async () => {
                  await install();
                  next();
                }}
              >
                Install
              </button>
            ) : (
              <button type="button" className="btn btn--primary setup__go" onClick={next}>
                Done
              </button>
            )}
            <button type="button" className="btn btn--ghost" onClick={next}>
              Later
            </button>
          </div>
        </>
      )}

      {step === 'done' && (
        <>
          <div className="setup__body">
            {recorder && <PersonAvatar name={recorder} size={120} active />}
            <h1>All set{recorder ? `, ${recorder}` : ''}!</h1>
            <p>
              Tap the big <b>+</b> to count animals. Tap <b>Listen</b> to name a bird by its call.
            </p>
          </div>
          <div className="setup__foot">
            <button type="button" className="btn btn--primary setup__go" onClick={() => setSetting('setupDone', true)}>
              Start
            </button>
          </div>
        </>
      )}
    </div>
  );
}
