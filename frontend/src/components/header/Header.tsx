import { JSX, type Component } from 'solid-js'

import RawAppLogo from '@ensembl/ensembl-elements-common/icons/EMBL_EBI_logo.svg'

import HomeIcon from '../../icons/HomeIcon'

import './Header.css'

const AppLogo = RawAppLogo as unknown as Component<JSX.SvgSVGAttributes<SVGSVGElement>>

const Header: Component = () => {
    return (
        <header>
            <div class="header-container">
                <div class="header-left-group">
                    <button class="text-button">
                        <HomeIcon class="header-home-icon" fill="#0099FF" />
                    </button>
                    <AppLogo class="header-logo" />
                    <div class="header-text-group">
                        <span class="header-title">Anti-microbial resistance portal</span>
                        <span class="header-subtitle"> Data resources</span>
                    </div>
                </div>
                <div class="header-right-group">
                    <span class="header-latest">Latest data release</span>
                    <span class="header-date">&nbsp;2025-08</span>
                </div>
            </div>
        </header>
    )
}

export default Header
