import { registerPlugin } from '@wordpress/plugins';
import { PluginSidebarMoreMenuItem, PluginSidebar } from '@wordpress/edit-post';
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import GlobalPreview from './components/GlobalPreview';

const UniversalBlockSidebar = () => {
    return (
        <Fragment>
            <PluginSidebarMoreMenuItem target="universal-block-sidebar">
                {__('Universal Block Preview', 'universal-block')}
            </PluginSidebarMoreMenuItem>
            <PluginSidebar
                name="universal-block-sidebar"
                title={__('Universal Block Preview', 'universal-block')}
                icon="visibility"
            >
                <div style={{ padding: '16px' }}>
                    <GlobalPreview />
                </div>
            </PluginSidebar>
        </Fragment>
    );
};

registerPlugin('universal-block-sidebar', {
    render: UniversalBlockSidebar,
});