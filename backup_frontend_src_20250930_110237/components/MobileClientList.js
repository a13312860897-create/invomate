import React from 'react';
import { FiPhone, FiMail, FiMapPin, FiEdit, FiTrash2, FiMoreVertical } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const MobileClientList = ({ clients, onEdit, onDelete }) => {
  const { t } = useTranslation(['clients', 'common']);

  if (!clients || clients.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{t('clients:noClients')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {clients.map((client) => (
        <div key={client.id} className="mobile-card">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">
                {client.name}
              </h3>
              {client.company && (
                <p className="text-gray-600 text-sm mt-1">
                  {client.company}
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(client)}
                className="mobile-action-btn bg-blue-50 text-blue-600 hover:bg-blue-100"
                aria-label={t('common:edit')}
              >
                <FiEdit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(client.id)}
                className="mobile-action-btn bg-red-50 text-red-600 hover:bg-red-100"
                aria-label={t('common:delete')}
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {client.email && (
              <div className="flex items-center text-sm text-gray-600">
                <FiMail className="w-4 h-4 mr-2 text-gray-400" />
                <a 
                  href={`mailto:${client.email}`}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {client.email}
                </a>
              </div>
            )}
            
            {client.phone && (
              <div className="flex items-center text-sm text-gray-600">
                <FiPhone className="w-4 h-4 mr-2 text-gray-400" />
                <a 
                  href={`tel:${client.phone}`}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {client.phone}
                </a>
              </div>
            )}
            
            {client.address && (
              <div className="flex items-start text-sm text-gray-600">
                <FiMapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                <span className="break-words">{client.address}</span>
              </div>
            )}
          </div>

          {(client.taxNumber || client.registrationNumber) && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="grid grid-cols-1 gap-2 text-xs text-gray-500">
                {client.taxNumber && (
                  <div>
                    <span className="font-medium">{t('clients:taxNumber')}:</span> {client.taxNumber}
                  </div>
                )}
                {client.registrationNumber && (
                  <div>
                    <span className="font-medium">{t('clients:registrationNumber')}:</span> {client.registrationNumber}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MobileClientList;